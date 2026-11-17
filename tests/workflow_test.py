"""Browser regression tests. Run: python3 tests/workflow_test.py (system Chromium)."""
import functools
import http.server
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

class WorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}'
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 1500, 'height': 1000})
        self.page = self.context.new_page()
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.dialog_handler = lambda dialog: dialog.accept()
        self.page.on('dialog', self.dialog_handler)
        self.page.goto(self.base + '/Station.html')

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [], 'Unexpected browser errors')

    def add_patient(self):
        self.page.get_by_role('button', name='Neuen Patienten hinzufügen').click()
        name = self.page.locator("input[placeholder='Name']").last
        name.fill('Beispiel, Testperson')
        name.press('Tab')

    def test_patient_status_persistence_and_undo(self):
        self.add_patient()
        self.page.get_by_label('Versicherungsstatus', exact=True).select_option('private')
        self.page.get_by_label('Telemetrie', exact=True).select_option('joker')
        self.page.get_by_role('button', name='DNR', exact=True).click()
        self.page.get_by_role('button', name='DNI', exact=True).click()
        self.page.reload()
        status = self.page.locator('.patient-status > strong').inner_text()
        for marker in ['Privat', 'JOKER', 'DNR', 'DNI']:
            self.assertIn(marker, status)
        self.page.get_by_role('button', name='Patient löschen', exact=True).click()
        self.assertEqual(self.page.locator('.patient-card').count(), 0)
        self.page.locator('#undo-action').click()
        self.assertEqual(self.page.locator('.patient-card').count(), 1)
        self.page.locator('#patient-filter').select_option('joker')
        self.assertEqual(self.page.locator('.patient-card').count(), 1)
        self.page.get_by_label('Telemetrie', exact=True).select_option('none')
        self.assertEqual(self.page.locator('.patient-card').count(), 0)

    def test_medication_edit_print_epikrise_history_reconciliation(self):
        self.add_patient()
        self.page.get_by_role('button', name='Dosen / Gaben bearbeiten', exact=True).click()
        self.page.get_by_role('button', name='+ Medikament', exact=True).click()
        for label,value in [('name','Testpräparat'),('strength','1,25 mg'),('dose','1 Tablette'),('schedule','08:00 / 20:00'),('route','oral')]:
            self.page.get_by_label(label, exact=True).fill(value)
        self.page.locator('#medication-change-reason').fill('Test einer Dosisübernahme')
        self.page.get_by_role('button', name='Geprüfte Liste übernehmen').click()
        self.page.reload()
        self.assertIn('1,25 mg', self.page.locator('.patient-card .med-table').first.inner_text())
        defaults = self.page.evaluate('buildEpikriseDefaults(AppState.patients[0])')
        for text in ['1,25 mg','1 Tablette','08:00 / 20:00','oral']:
            self.assertIn(text, defaults['medikation'])
        self.page.get_by_role('button', name='Änderungsverlauf', exact=True).click()
        self.assertIn('Test einer Dosisübernahme',self.page.locator('#workflow-dialog').inner_text())
        self.page.locator('#workflow-dialog').get_by_role('button', name='Schließen').click()
        self.page.get_by_role('button', name='Aufnahme / Entlassung abgleichen', exact=True).click()
        self.page.locator('#discharge-med-notes').fill('Entlassentwurf Test')
        self.page.get_by_role('button', name='Aktuelle Liste als Entlassentwurf sichern').click()
        self.assertIn('Entlassentwurf Test',self.page.evaluate('buildEpikriseDefaults(AppState.patients[0]).medikation'))

    def test_medico_import_updates_room_but_not_clinical_fields_and_supports_undo(self):
        raw='Name;"G";"Geburtsdatum";"Station";"Fachrichtung";"Zimmer";"Bett";"Infektiös"\nBeispiel,Test;"M";"01.01.1960 00:00:00";"711";"INT1N";"Zimmer 7.117 (privat)";"2";"0"'
        def import_text(text):
            self.page.get_by_role('button', name='KIS Import öffnen').click()
            self.page.locator('#pasteArea').fill(text)
            self.page.locator('#btnImportAction').click()
        import_text(raw)
        self.assertEqual(self.page.locator('.patient-card').count(),1)
        self.assertEqual(self.page.get_by_label('Versicherungsstatus',exact=True).input_value(),'unknown')
        self.page.evaluate("AppState.patients[0].main_diagnosis='Dokumentation erhalten';saveData()")
        import_text(raw.replace('7.117','7.108'))
        self.assertEqual(self.page.locator('.patient-card').count(),1)
        self.assertEqual(self.page.evaluate('AppState.patients[0].room'),'7.108')
        self.assertEqual(self.page.evaluate('AppState.patients[0].main_diagnosis'),'Dokumentation erhalten')
        self.page.locator('#undo-action').click()
        self.assertEqual(self.page.evaluate('AppState.patients[0].room'),'7.117')

    def test_backup_import_validation_and_storage_failure_preserve_data(self):
        self.add_patient()
        before=self.page.evaluate('JSON.stringify(AppState.patients)')
        self.page.locator('#importFile').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':b'[{"id":"bad", "labSets":{}}]'})
        self.page.wait_for_timeout(100)
        self.assertEqual(self.page.evaluate('JSON.stringify(AppState.patients)'),before)
        result=self.page.evaluate("""()=>{const old=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new DOMException('quota','QuotaExceededError')};const before=JSON.stringify(AppState.patients);const ok=saveData();Storage.prototype.setItem=old;return {ok,same:before===JSON.stringify(AppState.patients)}}""")
        self.assertFalse(result['ok']);self.assertTrue(result['same'])
        with self.page.expect_download() as download:
            self.page.get_by_role('button',name='Daten exportieren',exact=True).click()
        data=json.loads(Path(download.value.path()).read_text())
        self.assertEqual(data['schemaVersion'],2)
        self.assertEqual(len(data['patients']),1)

    def test_bundle_and_modular_pages_have_same_offline_workflow(self):
        self.page.goto(self.base+'/Stationsliste-komplett.html')
        self.page.route('**/*', lambda route: route.abort() if route.request.url.startswith('http') else route.continue_())
        self.add_patient()
        self.assertEqual(self.page.locator('.patient-card').count(),1)
        self.page.get_by_role('button',name='Dosen / Gaben bearbeiten',exact=True).click()
        self.page.get_by_role('button',name='+ Medikament',exact=True).click()
        self.page.get_by_label('name',exact=True).fill('Offlinepräparat')
        self.page.get_by_role('button',name='Geprüfte Liste übernehmen').click()
        self.assertIn('Offlinepräparat',self.page.locator('.patient-card').inner_text())

    def test_retired_todo_metadata_stays_in_backup_but_not_patient_view(self):
        self.page.evaluate("()=>{AppState.patients=[StationModel.createPatient({todo_text:'[ ] Echo anmelden @TASKOWNER !2026-01-03'})];render()}")
        text=self.page.locator('.patient-card').inner_text()
        self.assertIn('Echo anmelden',text)
        self.assertNotIn('TASKOWNER',text)
        self.assertNotIn('2026-01-03',text)
        self.assertIn('@TASKOWNER',self.page.evaluate('AppState.patients[0].todo_text'))

    def test_bmp_preserves_source_doses_and_supports_undo(self):
        self.add_patient()
        self.page.remove_listener('dialog', self.dialog_handler)
        self.page.on('dialog', lambda dialog: dialog.accept('1') if dialog.type=='prompt' else dialog.accept())
        self.page.get_by_role('button',name='📠 BMP Scan',exact=True).click()
        self.page.locator('#bmp-input').fill('<MP><S><M a="Testpräparat" t="1-0-1 Tablette" m="1" n="0" /></S></MP>')
        self.page.locator('#bmpModal').get_by_role('button',name='Importieren',exact=True).click()
        value=self.page.evaluate('buildEpikriseDefaults(AppState.patients[0]).medikation')
        self.assertIn('1-0-1 Tablette',value)
        self.assertIn('m=1',value)
        self.page.locator('#undo-action').click()
        self.assertEqual(self.page.evaluate('AppState.patients[0].medications.length'),0)

    def test_warning_reviews_become_stale_after_context_changes(self):
        self.page.evaluate("()=>{AppState.patients=[StationModel.createPatient({meds_current:'Metformin · 1-0-1',labs:{egfr:'20'}})];render()}")
        self.page.remove_listener('dialog', self.dialog_handler)
        self.page.on('dialog', lambda dialog: dialog.accept('geprüft' if dialog.message.startswith('Prüfstatus') else 'Testbegründung'))
        self.page.get_by_role('button',name='Prüfstatus',exact=True).first.click()
        self.assertIn('Testbegründung',self.page.locator('.patient-card').inner_text())
        self.page.evaluate("()=>{AppState.patients[0].meds_current+=', Testpräparat';render()}")
        self.assertIn('erneut prüfen: Daten geändert',self.page.locator('.patient-card').inner_text())

    def test_print_profiles_keep_status_and_long_medication_lists(self):
        self.page.evaluate("""()=>{const p=StationModel.createPatient({name:'Drucktest',dnr:true,dni:true,insurance:'private',telemetry:'joker',meds_current:Array.from({length:35},(_,i)=>'MedikamentTest'+String(i).padStart(2,'0')+' · 1 mg').join(', '),labSets:[{id:'lab1',type:'labor',date:'2026-11-16',time:'08:00',entries:[{code:'V_HB',label:'Hb',value:'12',num:12,unit:'g/dl',ref:'12-16'}]}]});AppState.patients=[p];render()}""")
        with tempfile.TemporaryDirectory() as directory:
            for profile in ['full','visite','pocket','detail','lab']:
                with self.subTest(profile=profile):
                    self.page.locator('#printProfile').select_option(profile)
                    pdf=Path(directory)/(profile+'.pdf')
                    self.page.pdf(path=str(pdf),prefer_css_page_size=True)
                    text=subprocess.check_output(['pdftotext','-layout',str(pdf),'-'],text=True)
                    for marker in ['DNR','DNI','JOKER','Privat']:
                        self.assertIn(marker,text)
                    if profile!='lab':
                        for i in range(35): self.assertIn(f'MedikamentTest{i:02}',text)

if __name__=='__main__':
    unittest.main()
