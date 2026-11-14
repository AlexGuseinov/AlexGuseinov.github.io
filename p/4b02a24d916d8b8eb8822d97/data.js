/*
  Saxta "repository". Real tətbiqdə hər blok Oracle repository-dən API ilə gəlir:
  sources -> DG_SOURCE, tables/columns -> DG_DATA_ASSET, scans -> DG_SD_SCAN,
  findings -> DG_SD_FINDING (+ review event log), reports/edges -> Report Lineage
  (DG_REPORT*, DG_QUERY_*), terms/cdes -> glossary, dq* -> DQ modulu, audit -> audit outbox.
  Bütün adlar, şəxslər və rəqəmlər uydurmadır.
*/
window.SEED = (function () {
  const T = (src, schema, name, o) => Object.assign({ src, schema, name, kind: 'TABLE', id: `${src}:${schema}.${name}` }, o);

  const tables = [
    T('SRC-01', 'CBS', 'CUSTOMERS', { rows: 184230, domain: 'Müştəri', owner: 'Aynur S.', steward: 'Nigar Ə.', desc: 'Müştəri ana qeydləri (fiziki və hüquqi şəxslər)', scan: 'SCAN-0007',
      cols: [['CUST_ID', 'NUMBER(12)'], ['CUST_TYPE', 'CHAR(1)'], ['FIN_CODE', 'VARCHAR2(7)'], ['VOEN', 'VARCHAR2(10)'], ['FULL_NAME', 'VARCHAR2(200)'], ['BIRTH_DATE', 'DATE'], ['GENDER', 'CHAR(1)'], ['MARITAL_STATUS', 'VARCHAR2(10)'], ['MOBILE_PHONE', 'VARCHAR2(20)'], ['EMAIL', 'VARCHAR2(120)'], ['REG_ADDRESS', 'VARCHAR2(400)'], ['CREATED_AT', 'DATE']] }),
    T('SRC-01', 'CBS', 'ACCOUNTS', { rows: 402115, domain: 'Hesablar', owner: 'Səbinə A.', steward: 'Nigar Ə.', desc: 'Cari və əmanət hesabları', scan: 'SCAN-0007',
      cols: [['ACC_ID', 'NUMBER(12)'], ['ACC_NO', 'VARCHAR2(20)'], ['IBAN', 'VARCHAR2(28)'], ['CUST_ID', 'NUMBER(12)'], ['CCY', 'CHAR(3)'], ['BALANCE', 'NUMBER(18,2)'], ['OPEN_DATE', 'DATE'], ['STATUS', 'VARCHAR2(10)']] }),
    T('SRC-01', 'CBS', 'CUST_DOCS', { rows: 190870, domain: 'Müştəri', owner: null, steward: 'Nigar Ə.', desc: 'Şəxsiyyət sənədləri', scan: 'SCAN-0007',
      cols: [['DOC_ID', 'NUMBER(12)'], ['CUST_ID', 'NUMBER(12)'], ['DOC_TYPE', 'VARCHAR2(10)'], ['DOC_SERIES_NO', 'VARCHAR2(12)'], ['ISSUE_DATE', 'DATE'], ['SCAN_IMAGE', 'BLOB']] }),
    T('SRC-01', 'CBS', 'FX_RATES', { rows: 5840, domain: 'Xəzinə', owner: 'Səbinə A.', steward: 'Nigar Ə.', desc: 'Gündəlik rəsmi məzənnələr', scan: 'SCAN-0007',
      cols: [['RATE_DATE', 'DATE'], ['CCY', 'CHAR(3)'], ['RATE', 'NUMBER(12,6)']] }),
    T('SRC-02', 'LMS', 'LOAN_CONTRACTS', { rows: 96412, domain: 'Kredit', owner: 'Rauf M.', steward: 'Nigar Ə.', desc: 'Kredit müqavilələri', scan: 'SCAN-0008',
      cols: [['CONTRACT_ID', 'NUMBER(12)'], ['CUST_ID', 'NUMBER(12)'], ['PRODUCT_CODE', 'VARCHAR2(8)'], ['PRINCIPAL_AMT', 'NUMBER(18,2)'], ['OUTSTANDING_AMT', 'NUMBER(18,2)'], ['CCY', 'CHAR(3)'], ['DISB_DATE', 'DATE'], ['MATURITY_DATE', 'DATE'], ['OVERDUE_DAYS', 'NUMBER(5)'], ['STATUS', 'VARCHAR2(10)'], ['BRANCH_CODE', 'VARCHAR2(7)']] }),
    T('SRC-02', 'LMS', 'LOAN_SCHEDULE', { rows: 2310877, domain: 'Kredit', owner: 'Rauf M.', steward: 'Nigar Ə.', desc: 'Ödəniş qrafiki', scan: 'SCAN-0008',
      cols: [['CONTRACT_ID', 'NUMBER(12)'], ['DUE_DATE', 'DATE'], ['PRINCIPAL_DUE', 'NUMBER(18,2)'], ['INTEREST_DUE', 'NUMBER(18,2)'], ['PAID_FLAG', 'CHAR(1)']] }),
    T('SRC-02', 'LMS', 'COLLATERAL', { rows: 41220, domain: 'Kredit', owner: 'Rauf M.', steward: 'Nigar Ə.', desc: 'Girov qeydləri', scan: 'SCAN-0008',
      cols: [['COLL_ID', 'NUMBER(12)'], ['CONTRACT_ID', 'NUMBER(12)'], ['COLL_TYPE', 'VARCHAR2(10)'], ['MARKET_VALUE', 'NUMBER(18,2)'], ['OWNER_FIN', 'VARCHAR2(7)']] }),
    T('SRC-03', 'DWH', 'F_LOAN_DAILY', { rows: 35120440, domain: 'Kredit', owner: 'Rauf M.', steward: 'Nigar Ə.', desc: 'Gündəlik kredit portfeli snapshot-u', scan: 'SCAN-0010',
      cols: [['SNAP_DATE', 'DATE'], ['CONTRACT_ID', 'NUMBER(12)'], ['CUST_ID', 'NUMBER(12)'], ['PRODUCT_GRP', 'VARCHAR2(20)'], ['OUTSTANDING_AZN', 'NUMBER(18,2)'], ['DPD', 'NUMBER(5)'], ['DPD_BUCKET', 'VARCHAR2(8)'], ['IS_NPL', 'NUMBER(1)']] }),
    T('SRC-03', 'DWH', 'D_CUSTOMER', { rows: 184101, domain: 'Müştəri', owner: null, steward: 'Nigar Ə.', desc: 'Müştəri ölçüsü (maskalanmış FIN)', scan: 'SCAN-0010',
      cols: [['CUST_KEY', 'NUMBER(12)'], ['CUST_ID', 'NUMBER(12)'], ['FIN_MASKED', 'VARCHAR2(7)'], ['SEGMENT', 'VARCHAR2(20)'], ['REGION', 'VARCHAR2(40)']] }),
    T('SRC-03', 'DWH', 'V_NPL_SUMMARY', { kind: 'VIEW', rows: null, domain: 'Kredit', owner: 'Rauf M.', steward: 'Nigar Ə.', desc: 'NPL xülasəsi (view)', scan: 'SCAN-0010', scanFailed: 'ORA-00942: table or view does not exist (əsas cədvələ icazə yoxdur)',
      cols: [['SNAP_DATE', 'DATE'], ['PRODUCT_GRP', 'VARCHAR2(20)'], ['NPL_AMOUNT', 'NUMBER(18,2)'], ['TOTAL_AMOUNT', 'NUMBER(18,2)']] }),
    T('SRC-04', 'CRD', 'CARDS', { rows: 288400, domain: 'Kartlar', owner: null, steward: 'Nigar Ə.', desc: 'Kart qeydləri', scan: 'SCAN-0009',
      cols: [['CARD_ID', 'NUMBER(12)'], ['PAN', 'VARCHAR2(19)'], ['PAN_MASKED', 'VARCHAR2(19)'], ['EXP_DATE', 'VARCHAR2(5)'], ['CUST_ID', 'NUMBER(12)'], ['STATUS', 'VARCHAR2(10)']] }),
    T('SRC-04', 'CRD', 'TXN_LOG', { rows: 61200555, domain: 'Kartlar', owner: null, steward: 'Nigar Ə.', desc: 'Kart əməliyyatları jurnalı', scan: 'SCAN-0009',
      cols: [['TXN_ID', 'NUMBER(16)'], ['PAN', 'VARCHAR2(19)'], ['AMOUNT', 'NUMBER(18,2)'], ['MCC', 'CHAR(4)'], ['TERMINAL_IP', 'VARCHAR2(45)'], ['TXN_TS', 'TIMESTAMP']] }),
  ];

  const sources = [
    { id: 'SRC-01', alias: 'CORE', name: 'Əsas bank sistemi', type: 'Oracle 19c', env: 'TEST', owner: 'Core Banking IT', secretRef: 'vault://nb-test/cbs_ro', schemas: ['CBS'],
      identity: { status: 'VERIFIED', dbName: 'CBSTST', dbid: '2291847731', service: 'cbs_tst', host: 'cbs-tst.nb.local', by: 'Elvin H.', at: '10.11.2026 10:14' } },
    { id: 'SRC-02', alias: 'LOAN', name: 'Kredit idarəetmə sistemi', type: 'Oracle 19c', env: 'TEST', owner: 'Kredit IT', secretRef: 'vault://nb-test/lms_ro', schemas: ['LMS'],
      identity: { status: 'VERIFIED', dbName: 'LMSTST', dbid: '3810022945', service: 'lms_tst', host: 'lms-tst.nb.local', by: 'Elvin H.', at: '10.11.2026 10:31' } },
    { id: 'SRC-03', alias: 'DWH', name: 'Məlumat anbarı', type: 'Oracle 19c', env: 'TEST', owner: 'BI komandası', secretRef: 'vault://nb-test/dwh_ro', schemas: ['DWH'],
      identity: { status: 'VERIFIED', dbName: 'DWHTST', dbid: '1170456621', service: 'dwh_tst', host: 'dwh-tst.nb.local', by: 'Elvin H.', at: '11.11.2026 09:02' } },
    { id: 'SRC-04', alias: 'CARD', name: 'Kart prosessinqi', type: 'Oracle 19c', env: 'TEST', owner: 'Kart IT', secretRef: 'vault://nb-test/crd_ro', schemas: ['CRD'],
      identity: { status: 'VERIFIED', dbName: 'CRDTST', dbid: '4402918830', service: 'crd_tst', host: 'crd-tst.nb.local', by: 'Elvin H.', at: '11.11.2026 09:40' } },
    { id: 'SRC-05', alias: 'CORE', name: 'Əsas bank sistemi (ikinci qeydiyyat)', type: 'Oracle 19c', env: 'TEST', owner: 'Core Banking IT', secretRef: 'vault://nb-test/cbs_uat_ro', schemas: ['CBS'],
      identity: { status: 'CONFLICT', dbName: 'CBSUAT', dbid: '2291990012', service: 'cbs_uat', host: 'cbs-uat.nb.local', conflictWith: 'SRC-01', by: null, at: null } },
  ];

  const scans = [
    { id: 'SCAN-0006', src: 'SRC-03', scope: ['DWH.*'], detVer: '1.2.0', sample: 5, method: 'İlk N sətir (köhnə rejim)', status: 'SUCCEEDED', planned: 3, scanned: 3, failed: 0, skipped: 0, started: '02.11.2026 14:10', dur: '0:41', published: false, note: 'Köhnə versiya: 5 sətir və ilk-N nümunə. Nəticəsi "son etibarlı snapshot" sayılmır.' },
    { id: 'SCAN-0007', src: 'SRC-01', scope: ['CBS.*'], detVer: '1.3.0', sample: 1000, method: 'Təsadüfi (SAMPLE BLOCK)', status: 'SUCCEEDED', planned: 4, scanned: 4, failed: 0, skipped: 0, colsSkipped: 1, started: '10.11.2026 10:20', dur: '3:12', published: true, note: '1 sütun (BLOB) dəstəklənmir, ayrıca qeyd olunub.' },
    { id: 'SCAN-0008', src: 'SRC-02', scope: ['LMS.*'], detVer: '1.3.0', sample: 1000, method: 'Təsadüfi (SAMPLE BLOCK)', status: 'SUCCEEDED', planned: 3, scanned: 3, failed: 0, skipped: 0, started: '10.11.2026 11:05', dur: '2:48', published: true },
    { id: 'SCAN-0009', src: 'SRC-04', scope: ['CRD.*'], detVer: '1.3.0', sample: 1000, method: 'Təsadüfi (SAMPLE BLOCK)', status: 'SUCCEEDED', planned: 2, scanned: 2, failed: 0, skipped: 0, started: '11.11.2026 09:55', dur: '4:20', published: true },
    { id: 'SCAN-0010', src: 'SRC-03', scope: ['DWH.*'], detVer: '1.3.0', sample: 1000, method: 'Təsadüfi (SAMPLE BLOCK)', status: 'PARTIAL', planned: 3, scanned: 2, failed: 1, skipped: 0, started: '12.11.2026 16:30', dur: '6:03', published: true, note: 'V_NPL_SUMMARY: ORA-00942. Uğurlu 2 cədvəl dərc olundu, uğursuz obyekt "skan olunmayıb" kimi qalır.' },
  ];

  const detectors = [
    ['FIN', 'Şəxsiyyət vəsiqəsi FIN kodu', '7 simvol, hərf+rəqəm; v1.3-də fərqli dəyər nisbəti və ad konteksti əlavə olunub', '1.3.0', 0.96, 0.93],
    ['VOEN', 'Vergi ödəyicisinin VÖEN-i', '10 rəqəm; v1.3-də son rəqəmə görə yoxlama', '1.3.0', 0.94, 0.97],
    ['PAN', 'Kart nömrəsi', '13–19 rəqəm + Luhn yoxlaması; maskalanmış format ayrıca tanınır', '1.3.0', 0.99, 0.98],
    ['IBAN', 'IBAN', 'AZ + 2 rəqəm + 4 hərf + 20 simvol, mod-97', '1.3.0', 1.0, 0.99],
    ['ACCOUNT', 'Hesab nömrəsi', '20 rəqəm, bank formatı', '1.3.0', 0.9, 0.92],
    ['CIF', 'Müştəri ID', 'Sütun adı + rəqəm formatı', '1.3.0', 0.82, 0.88],
    ['S_NO', 'Sənəd seriya/nömrəsi', 'AA/AZE + rəqəmlər', '1.3.0', 0.93, 0.9],
    ['NAME', 'Ad, soyad', 'Lüğət + forma (Ad Soyad Ata adı)', '1.3.0', 0.88, 0.85],
    ['PHONE', 'Telefon', '+994 / 0 + operator kodu', '1.3.0', 0.97, 0.95],
    ['EMAIL', 'E-poçt', 'RFC 5322 sadələşdirilmiş forma', '1.3.0', 0.99, 0.99],
    ['ADDRESS', 'Ünvan', 'Şəhər/rayon lüğəti + küçə açar sözləri', '1.3.0', 0.8, 0.74],
    ['SWIFT', 'SWIFT/BIC', '8 və ya 11 simvol, ölkə kodu', '1.3.0', 0.98, 0.96],
    ['IP', 'IP ünvanı', 'IPv4/IPv6 forma', '1.3.0', 0.99, 0.99],
    ['GENDER', 'Cins', 'Kiçik dəyər dəsti (M/F/K/Q)', '1.3.0', 0.86, 0.9],
    ['MARITAL_STATUS', 'Ailə vəziyyəti', 'Kiçik dəyər dəsti', '1.3.0', 0.84, 0.88],
  ].map(([code, name, method, ver, precision, recall]) => ({ code, name, method, ver, precision, recall }));

  const F = (id, col, det, o) => Object.assign({ id, col, det, ver: '1.3.0', status: 'CANDIDATE', decision: null, label: null, history: [] }, o);
  const ok = (by, at) => ({ by, at });
  const findings = [
    F('F-101', 'SRC-01:CBS.CUSTOMERS.FIN_CODE', 'FIN', { scan: 'SCAN-0007', sample: 1000, nonNull: 991, matched: 986, distinct: 0.99, status: 'CONFIRMED',
      decision: { by: 'Nigar Ə.', at: '10.11.2026 14:02', comment: 'Fiziki şəxslər üçün FIN. Hüquqi şəxslərdə boşdur.' },
      label: { level: 'Restricted', policy: 'v3', need: ['owner', 'infosec'], approvals: { owner: ok('Aynur S.', '11.11.2026 09:15'), infosec: ok('Leyla Q.', '11.11.2026 10:40') } } }),
    F('F-102', 'SRC-01:CBS.CUSTOMERS.VOEN', 'VOEN', { scan: 'SCAN-0007', sample: 1000, nonNull: 415, matched: 412, distinct: 0.98 }),
    F('F-103', 'SRC-01:CBS.CUSTOMERS.FULL_NAME', 'NAME', { scan: 'SCAN-0007', sample: 1000, nonNull: 1000, matched: 940, distinct: 0.97, status: 'CONFIRMED',
      decision: { by: 'Nigar Ə.', at: '10.11.2026 14:05', comment: 'Tam ad.' },
      label: { level: 'Confidential', policy: 'v3', need: ['owner'], approvals: { owner: null } } }),
    F('F-104', 'SRC-01:CBS.CUSTOMERS.MOBILE_PHONE', 'PHONE', { scan: 'SCAN-0007', sample: 1000, nonNull: 983, matched: 977, distinct: 0.99 }),
    F('F-105', 'SRC-01:CBS.CUSTOMERS.EMAIL', 'EMAIL', { scan: 'SCAN-0007', sample: 1000, nonNull: 604, matched: 601, distinct: 1.0, status: 'CONFLICT',
      prev: { status: 'REJECTED', ver: '1.2.0', sample: 5, scan: 'SCAN-0003', by: 'Steward (əvvəlki)', at: '28.10.2026', comment: '5 sətirlik nümunədə hamısı boş idi.' } }),
    F('F-106', 'SRC-01:CBS.CUSTOMERS.REG_ADDRESS', 'ADDRESS', { scan: 'SCAN-0007', sample: 1000, nonNull: 1000, matched: 702, distinct: 0.91, status: 'NEEDS_INVESTIGATION',
      decision: { by: 'Nigar Ə.', at: '10.11.2026 14:11', comment: 'Bir hissəsi sərbəst mətndir, ünvan olmayan qeydlər var. Mənbə sahibindən soruşulur.' } }),
    F('F-107', 'SRC-01:CBS.CUSTOMERS.GENDER', 'GENDER', { scan: 'SCAN-0007', sample: 1000, nonNull: 1000, matched: 1000, distinct: 0.002 }),
    F('F-108', 'SRC-01:CBS.CUSTOMERS.MARITAL_STATUS', 'MARITAL_STATUS', { scan: 'SCAN-0007', sample: 1000, nonNull: 966, matched: 966, distinct: 0.004 }),
    F('F-109', 'SRC-01:CBS.CUST_DOCS.DOC_SERIES_NO', 'S_NO', { scan: 'SCAN-0007', sample: 1000, nonNull: 1000, matched: 995, distinct: 1.0, status: 'CONFIRMED',
      decision: { by: 'Nigar Ə.', at: '10.11.2026 14:20', comment: 'Şəxsiyyət vəsiqəsinin seriya və nömrəsi.' },
      label: { level: 'Restricted', policy: 'v3', need: ['owner', 'infosec'], approvals: { owner: null, infosec: ok('Leyla Q.', '11.11.2026 10:42') } } }),
    F('F-110', 'SRC-01:CBS.ACCOUNTS.IBAN', 'IBAN', { scan: 'SCAN-0007', sample: 1000, nonNull: 1000, matched: 1000, distinct: 1.0, checks: 'mod-97: 1000/1000', status: 'CONFIRMED',
      decision: { by: 'Nigar Ə.', at: '10.11.2026 14:24', comment: 'IBAN.' },
      label: { level: 'Confidential', policy: 'v3', need: ['owner'], approvals: { owner: ok('Səbinə A.', '11.11.2026 12:00') } } }),
    F('F-111', 'SRC-01:CBS.ACCOUNTS.ACC_NO', 'ACCOUNT', { scan: 'SCAN-0007', sample: 1000, nonNull: 1000, matched: 998, distinct: 1.0 }),
    F('F-112', 'SRC-02:LMS.COLLATERAL.OWNER_FIN', 'FIN', { scan: 'SCAN-0008', sample: 1000, nonNull: 301, matched: 288, distinct: 0.95 }),
    F('F-113', 'SRC-02:LMS.LOAN_CONTRACTS.BRANCH_CODE', 'FIN', { scan: 'SCAN-0008', sample: 1000, nonNull: 1000, matched: 1000, distinct: 0.038,
      hint: 'Uyğunluq 100%, amma cəmi 38 fərqli dəyər var: bu, şəxsi kod yox, kataloq kodu ola bilər (məs. filial kodu).' }),
    F('F-114', 'SRC-04:CRD.CARDS.PAN', 'PAN', { scan: 'SCAN-0009', sample: 1000, nonNull: 1000, matched: 1000, distinct: 1.0, checks: 'Luhn: 1000/1000', status: 'CONFIRMED',
      decision: { by: 'Nigar Ə.', at: '11.11.2026 11:02', comment: 'Tam kart nömrəsi, şifrələnməyib.' },
      label: { level: 'Restricted', policy: 'v3', need: ['owner', 'infosec'], approvals: { owner: null, infosec: ok('Leyla Q.', '11.11.2026 11:30') } } }),
    F('F-115', 'SRC-04:CRD.TXN_LOG.PAN', 'PAN', { scan: 'SCAN-0009', sample: 1000, nonNull: 1000, matched: 998, distinct: 0.62, checks: 'Luhn: 998/1000' }),
    F('F-116', 'SRC-04:CRD.CARDS.PAN_MASKED', 'PAN', { scan: 'SCAN-0009', sample: 1000, nonNull: 1000, matched: 0, distinct: 0.99, checks: 'Luhn: 0/1000, maskalanmış forma: 1000/1000', status: 'REJECTED',
      decision: { by: 'Nigar Ə.', at: '11.11.2026 11:05', comment: 'Maskalanmış PAN (ilk 6 + son 4). Tam nömrə deyil, xam PAN ilə eyni risk deyil.' } }),
    F('F-117', 'SRC-04:CRD.TXN_LOG.TERMINAL_IP', 'IP', { scan: 'SCAN-0009', sample: 1000, nonNull: 1000, matched: 1000, distinct: 0.07 }),
  ];

  const reports = [
    { id: 'R-101', name: 'NPL hesabatı (aylıq, tənzimləyici üçün)', owner: 'Rauf M.', query: 'Q-5531', parsed: '11.11.2026 22:40', fields: ['SNAP_DATE', 'PRODUCT_GRP', 'TOTAL_PORTFOLIO', 'NPL_AMOUNT', 'NPL_RATIO'] },
    { id: 'R-102', name: 'Gecikmə yaşlanması (aging)', owner: 'Rauf M.', query: 'Q-5710', parsed: '11.11.2026 22:41', fields: ['DPD_BUCKET', 'OUTSTANDING', 'CONTRACT_CNT'] },
    { id: 'R-103', name: 'Müştəri kredit çıxarışı', owner: 'Filial şəbəkəsi', query: 'Q-6120', parsed: '11.11.2026 22:43', fields: ['FULL_NAME', 'FIN_CODE', 'CONTRACT_ID', 'OUTSTANDING'] },
    { id: 'R-104', name: 'Kart əməliyyatları monitorinqi', owner: 'Fırıldaqla mübarizə', query: 'Q-6301', parsed: '11.11.2026 22:44', fields: ['CARD', 'AMOUNT', 'MCC'] },
  ];

  const E = (from, to, tf, o) => Object.assign({ from, to, tf, status: 'VERIFIED' }, o);
  const edges = [
    E('SRC-02:LMS.LOAN_CONTRACTS.OVERDUE_DAYS', 'SRC-03:DWH.F_LOAN_DAILY.DPD', 'birbaşa (PKG_DWH_LOAD.LOAD_LOAN_DAILY)'),
    E('SRC-02:LMS.LOAN_CONTRACTS.OVERDUE_DAYS', 'SRC-03:DWH.F_LOAN_DAILY.DPD_BUCKET', 'CASE: 0 / 1–30 / 31–60 / 61–90 / 90+'),
    E('SRC-02:LMS.LOAN_CONTRACTS.OVERDUE_DAYS', 'SRC-03:DWH.F_LOAN_DAILY.IS_NPL', 'CASE WHEN OVERDUE_DAYS > 90 THEN 1 ELSE 0'),
    E('SRC-02:LMS.LOAN_CONTRACTS.OUTSTANDING_AMT', 'SRC-03:DWH.F_LOAN_DAILY.OUTSTANDING_AZN', 'OUTSTANDING_AMT × RATE'),
    E('SRC-02:LMS.LOAN_CONTRACTS.CCY', 'SRC-03:DWH.F_LOAN_DAILY.OUTSTANDING_AZN', 'məzənnə seçimi (JOIN ON CCY)'),
    E('link:CORE_LNK/CBS.FX_RATES.RATE', 'SRC-03:DWH.F_LOAN_DAILY.OUTSTANDING_AZN', 'OUTSTANDING_AMT × RATE (FX_RATES@CORE_LNK)', { status: 'AMBIGUOUS', link: 'CORE_LNK' }),
    E('SRC-02:LMS.LOAN_CONTRACTS.PRODUCT_CODE', 'SRC-03:DWH.F_LOAN_DAILY.PRODUCT_GRP', 'lookup (PRODUCT_MAP)'),
    E('SRC-02:LMS.LOAN_CONTRACTS.CONTRACT_ID', 'SRC-03:DWH.F_LOAN_DAILY.CONTRACT_ID', 'birbaşa'),
    E('SRC-03:DWH.F_LOAN_DAILY.SNAP_DATE', 'R-101:SNAP_DATE', 'birbaşa'),
    E('SRC-03:DWH.F_LOAN_DAILY.PRODUCT_GRP', 'R-101:PRODUCT_GRP', 'GROUP BY'),
    E('SRC-03:DWH.F_LOAN_DAILY.OUTSTANDING_AZN', 'R-101:TOTAL_PORTFOLIO', 'SUM'),
    E('SRC-03:DWH.F_LOAN_DAILY.OUTSTANDING_AZN', 'R-101:NPL_AMOUNT', 'SUM(CASE WHEN IS_NPL = 1 …)'),
    E('SRC-03:DWH.F_LOAN_DAILY.IS_NPL', 'R-101:NPL_AMOUNT', 'filtr (IS_NPL = 1)'),
    E('SRC-03:DWH.F_LOAN_DAILY.OUTSTANDING_AZN', 'R-101:NPL_RATIO', 'SUM(NPL) / SUM(hamısı)'),
    E('SRC-03:DWH.F_LOAN_DAILY.IS_NPL', 'R-101:NPL_RATIO', 'SUM(NPL) / SUM(hamısı)'),
    E('SRC-03:DWH.F_LOAN_DAILY.DPD_BUCKET', 'R-102:DPD_BUCKET', 'GROUP BY'),
    E('SRC-03:DWH.F_LOAN_DAILY.OUTSTANDING_AZN', 'R-102:OUTSTANDING', 'SUM'),
    E('dyn:Q-5710', 'R-102:CONTRACT_CNT', 'EXECUTE IMMEDIATE v_sql (dinamik SQL)', { status: 'UNRESOLVED' }),
    E('link:CORE_LNK/CBS.CUSTOMERS.FULL_NAME', 'R-103:FULL_NAME', 'birbaşa (CUSTOMERS@CORE_LNK)', { status: 'AMBIGUOUS', link: 'CORE_LNK' }),
    E('link:CORE_LNK/CBS.CUSTOMERS.FIN_CODE', 'R-103:FIN_CODE', 'birbaşa (CUSTOMERS@CORE_LNK), maskasız', { status: 'AMBIGUOUS', link: 'CORE_LNK' }),
    E('SRC-02:LMS.LOAN_CONTRACTS.CONTRACT_ID', 'R-103:CONTRACT_ID', 'birbaşa'),
    E('SRC-02:LMS.LOAN_CONTRACTS.OUTSTANDING_AMT', 'R-103:OUTSTANDING', 'birbaşa'),
    E('SRC-04:CRD.CARDS.PAN_MASKED', 'R-104:CARD', 'birbaşa'),
    E('SRC-04:CRD.TXN_LOG.AMOUNT', 'R-104:AMOUNT', 'birbaşa'),
    E('SRC-04:CRD.TXN_LOG.MCC', 'R-104:MCC', 'birbaşa'),
  ];

  const lineageQueue = [
    { id: 'LQ-1', kind: 'DB_LINK', link: 'CORE_LNK', title: 'DB link CORE_LNK iki mənbəyə uyğun gəlir',
      why: 'Sorğular CBS.*@CORE_LNK-ə müraciət edir. "CORE" alias-ı həm SRC-01 (CBSTST), həm də SRC-05 (CBSUAT) üçün qeyd olunub. Parser hansının olduğunu sübut edə bilmir, ona görə əlaqə dərc olunmur.',
      queries: ['Q-5531 (PKG_DWH_LOAD.LOAD_LOAN_DAILY)', 'Q-6120 (R-103)'],
      candidates: [
        { src: 'SRC-01', evidence: 'DBA-dan alınmış link tərifi: HOST=cbs-tst.nb.local, SERVICE=cbs_tst. SRC-01-in təsdiqli kimliyi ilə üst-üstə düşür.' },
        { src: 'SRC-05', evidence: 'Yalnız alias eynidir. Link tərifi bu hosta işarə etmir.' },
      ], status: 'OPEN' },
    { id: 'LQ-2', kind: 'DYNAMIC', title: 'R-102 CONTRACT_CNT dinamik SQL-dən gəlir',
      why: 'Sahə EXECUTE IMMEDIATE ilə yığılan SQL-dən hesablanır. Statik təhlil mənbəni tapa bilmir. Manual mapping yalnız sübut (SQL sahibinin izahı, kod parçası) ilə qəbul olunur.',
      queries: ['Q-5710 (R-102)'],
      candidates: [{ node: 'SRC-03:DWH.F_LOAN_DAILY.CONTRACT_ID', evidence: 'Hesabat sahibinin təsviri: "COUNT(DISTINCT CONTRACT_ID) F_LOAN_DAILY üzrə".' }], status: 'OPEN' },
  ];

  const domains = [
    { id: 'DOM-KR', name: 'Kredit', charter: 'APPROVED', owner: 'Rauf M.', steward: 'Nigar Ə.', scope: 'Fiziki və hüquqi şəxslərə kreditlər, girov, gecikmə, NPL', at: '12.11.2026' },
    { id: 'DOM-MU', name: 'Müştəri', charter: 'DRAFT', owner: 'Aynur S. (təklif)', steward: 'Nigar Ə.', scope: 'Müştəri ana qeydləri, sənədlər, əlaqə məlumatları', at: null },
  ];

  const terms = [
    { id: 'TRM-01', name: 'Problemli kredit (NPL)', domain: 'DOM-KR', status: 'APPROVED', def: 'Əsas borc və ya faiz ödənişi 90 gündən çox gecikmiş kredit. (Nümunə tərif: bankın rəsmi tərifi ilə əvəz olunmalıdır.)' },
    { id: 'TRM-02', name: 'Gecikmə günü (DPD)', domain: 'DOM-KR', status: 'APPROVED', def: 'Ən köhnə ödənilməmiş ödəniş tarixindən hesabat tarixinədək təqvim günlərinin sayı.' },
    { id: 'TRM-03', name: 'Kredit portfeli (qalıq)', domain: 'DOM-KR', status: 'IN_REVIEW', def: 'Hesabat tarixinə əsas borc qalığının AZN ekvivalenti.' },
    { id: 'TRM-04', name: 'FIN kod', domain: 'DOM-MU', status: 'DRAFT', def: 'Şəxsiyyət vəsiqəsindəki 7 simvollu fərdi identifikasiya nömrəsi.' },
  ];

  const cdes = [
    { id: 'CDE-01', name: 'NPL nisbəti', term: 'TRM-01', report: 'R-101:NPL_RATIO', owner: 'Rauf M.', crit: 'Yüksək', status: 'IN_REVIEW',
      formula: 'Σ OUTSTANDING_AZN (IS_NPL = 1)  ÷  Σ OUTSTANDING_AZN',
      maps: [
        { node: 'SRC-03:DWH.F_LOAN_DAILY.OUTSTANDING_AZN', status: 'APPROVED' },
        { node: 'SRC-03:DWH.F_LOAN_DAILY.IS_NPL', status: 'APPROVED' },
        { node: 'SRC-02:LMS.LOAN_CONTRACTS.OVERDUE_DAYS', status: 'APPROVED' },
        { node: 'SRC-02:LMS.LOAN_CONTRACTS.OUTSTANDING_AMT', status: 'APPROVED' },
        { node: 'link:CORE_LNK/CBS.FX_RATES.RATE', status: 'BLOCKED' },
      ], dq: ['DQB-01', 'DQB-03'] },
    { id: 'CDE-02', name: 'Gecikmə günü', term: 'TRM-02', report: 'R-102:DPD_BUCKET', owner: 'Rauf M.', crit: 'Yüksək', status: 'APPROVED',
      formula: 'DPD = hesabat tarixi − ən köhnə ödənilməmiş ödəniş tarixi',
      maps: [{ node: 'SRC-02:LMS.LOAN_CONTRACTS.OVERDUE_DAYS', status: 'APPROVED' }, { node: 'SRC-03:DWH.F_LOAN_DAILY.DPD_BUCKET', status: 'APPROVED' }], dq: ['DQB-01'] },
    { id: 'CDE-03', name: 'Kredit portfeli', term: 'TRM-03', report: 'R-101:TOTAL_PORTFOLIO', owner: 'Rauf M.', crit: 'Yüksək', status: 'DRAFT',
      formula: 'Σ OUTSTANDING_AZN hesabat tarixinə',
      maps: [{ node: 'SRC-03:DWH.F_LOAN_DAILY.OUTSTANDING_AZN', status: 'PROPOSED' }], dq: ['DQB-04'] },
  ];

  const dqDefs = [
    { id: 'DQD-01', name: 'Gecikmə günü mənfi ola bilməz', dim: 'Etibarlılıq', logic: 'dəyər ≥ 0', sev: 'Yüksək', ver: 2, status: 'APPROVED', by: 'Rauf M.' },
    { id: 'DQD-02', name: 'Fiziki şəxsin FIN-i boş olmamalıdır', dim: 'Tamlıq', logic: "NOT NULL, harada ki CUST_TYPE = 'F'", sev: 'Yüksək', ver: 1, status: 'DRAFT', by: null, note: 'Müştəri domeninin xartiyası hələ qaralamadır. Qaydanı təsdiq edəcək sahib rəsmiləşməyib.' },
    { id: 'DQD-03', name: 'Anbar cəmi mənbə cəmi ilə tutuşur', dim: 'Uyğunluq', logic: '|Σ anbar − Σ mənbə| ÷ Σ mənbə ≤ 0,5%', sev: 'Kritik', ver: 1, status: 'APPROVED', by: 'Rauf M.' },
    { id: 'DQD-04', name: 'Qalıq məbləğ mənfi deyil', dim: 'Etibarlılıq', logic: 'dəyər ≥ 0', sev: 'Orta', ver: 1, status: 'APPROVED', by: 'Rauf M.' },
  ];

  const dqBinds = [
    { id: 'DQB-01', def: 'DQD-01', node: 'SRC-02:LMS.LOAN_CONTRACTS.OVERDUE_DAYS', threshold: 100, sched: 'Hər gün 06:00', coverage: 'Tam' },
    { id: 'DQB-02', def: 'DQD-02', node: 'SRC-01:CBS.CUSTOMERS.FIN_CODE', threshold: 99.5, sched: 'Hər gün 06:00', coverage: 'Tam' },
    { id: 'DQB-03', def: 'DQD-03', node: 'SRC-03:DWH.F_LOAN_DAILY.OUTSTANDING_AZN', ref: 'SRC-02:LMS.LOAN_CONTRACTS.OUTSTANDING_AMT', threshold: 99.5, sched: 'Hər gün 06:05', coverage: 'Tam' },
    { id: 'DQB-04', def: 'DQD-04', node: 'SRC-03:DWH.F_LOAN_DAILY.OUTSTANDING_AZN', threshold: 100, sched: 'Hər gün 06:10', coverage: 'Son 30 gün' },
  ];

  const dqRuns = [
    { id: 'DQR-1047', bind: 'DQB-01', at: '13.11.2026 06:00', result: 'PASS', pass: 96410, den: 96410 },
    { id: 'DQR-1048', bind: 'DQB-04', at: '13.11.2026 06:10', result: 'NOT_EVALUATED', note: 'Mənbə əlçatan deyildi (şəbəkə). Bu, "keçdi" sayılmır.' },
    { id: 'DQR-1049', bind: 'DQB-03', at: '13.11.2026 06:05', result: 'PASS', pass: 9986, den: 10000, scoreNote: 'tutuşma 99,86%' },
    { id: 'DQR-1051', bind: 'DQB-01', at: '14.11.2026 06:00', result: 'PASS', pass: 96412, den: 96412 },
    { id: 'DQR-1052', bind: 'DQB-03', at: '14.11.2026 06:05', result: 'FAIL', pass: 9921, den: 10000, scoreNote: 'tutuşma 99,21%: fərq 3 məhsul qrupunda (ipoteka, avto, mikro)' },
    { id: 'DQR-1053', bind: 'DQB-04', at: '14.11.2026 06:10', result: 'ERROR', note: 'ORA-01031: insufficient privileges. Qiymətləndirilmədi.' },
  ];

  const issues = [
    { id: 'ISS-07', run: 'DQR-1052', bind: 'DQB-03', title: 'Anbar və mənbə qalığı 0,79% fərqlənir', sev: 'Kritik', assignee: 'Rauf M.', status: 'OPEN', due: '18.11.2026',
      note: 'Platforma mənbədə heç nə dəyişmir. Düzəliş mənbə sahibinin işidir; bağlanma yalnız təkrar run-un PASS nəticəsi ilə olur.' },
  ];

  const access = {
    'SRC-01:CBS.CUSTOMERS': {
      snapshot: '09.11.2026 (DBA idxalı, InfoSec təsdiqi ilə)',
      grants: [
        { who: 'SVC_DWH_LOAD', kind: 'Servis hesabı', n: 1, priv: 'SELECT', risk: null },
        { who: 'R_REPORTING', kind: 'Rol', n: 14, priv: 'SELECT', risk: 'R-103 hesabatı FIN-i maskasız göstərir' },
        { who: 'R_CALLCENTER', kind: 'Rol', n: 32, priv: 'SELECT', risk: 'Restricted sütunlara geniş giriş' },
      ],
      requests: [{ id: 'ACR-12', what: 'R_CALLCENTER-i CUSTOMERS əvəzinə maskalanmış view-a keçirmək', approved: 'Rauf M., 12.11.2026', applied: false, ticket: 'CHG-88213 (ITSM, gözləyir)' }],
    },
  };

  const gates = [
    { id: 'G0', name: 'Baza (A/B audit, checksum-lar)', status: 'PARTIAL' },
    { id: 'G1', name: 'Mənbə kimliyi', status: 'PARTIAL' },
    { id: 'G2', name: 'Kəşf (discovery)', status: 'NOT_RUN' },
    { id: 'G3', name: 'Lineage', status: 'NOT_RUN' },
    { id: 'G4', name: 'Kredit governance', status: 'NOT_RUN' },
    { id: 'G5', name: 'Əməliyyat və UAT', status: 'NOT_RUN' },
    { id: 'G6', name: 'İkinci bank / Retail', status: 'NOT_RUN' },
  ];

  const audit = [
    ['10.11.2026 10:14', 'Elvin H.', 'DG Operator', 'Mənbə kimliyi təsdiqləndi', 'SRC-01', 'DBID 2291847731, DB_NAME CBSTST'],
    ['10.11.2026 10:20', 'Elvin H.', 'DG Operator', 'Skan başladıldı', 'SCAN-0007', 'CBS.*, detektor 1.3.0, 1000 təsadüfi sətir'],
    ['10.11.2026 14:02', 'Nigar Ə.', 'Data Steward', 'Tapıntı təsdiqləndi', 'F-101', 'FIN, 986/991'],
    ['11.11.2026 09:15', 'Aynur S.', 'Data Owner', 'Etiket təsdiqləndi (Owner)', 'F-101', 'Restricted, siyasət v3'],
    ['11.11.2026 10:40', 'Leyla Q.', 'InfoSec', 'Etiket təsdiqləndi (InfoSec)', 'F-101', 'Restricted effektiv oldu'],
    ['11.11.2026 11:05', 'Nigar Ə.', 'Data Steward', 'Tapıntı rədd edildi', 'F-116', 'Maskalanmış PAN'],
    ['12.11.2026 09:30', 'Rauf M.', 'Data Owner', 'Domen xartiyası təsdiqləndi', 'DOM-KR', 'Kredit'],
    ['12.11.2026 16:30', 'Elvin H.', 'DG Operator', 'Skan başladıldı', 'SCAN-0010', 'DWH.*'],
    ['12.11.2026 16:36', 'sistem', 'Worker', 'Skan qismən bitdi', 'SCAN-0010', '1 obyekt uğursuz: ORA-00942'],
    ['13.11.2026 08:12', 'Elvin H.', 'DG Operator', 'Mənbə qeyd olundu', 'SRC-05', 'Alias "CORE" SRC-01 ilə toqquşur, nəşr dayandırıldı'],
    ['14.11.2026 06:05', 'sistem', 'DQ mühərriki', 'DQ run: FAIL', 'DQR-1052', '99,21% < 99,5%'],
    ['14.11.2026 06:06', 'sistem', 'DQ mühərriki', 'Problem açıldı', 'ISS-07', 'Təyin olundu: Rauf M.'],
  ].map(([at, actor, role, action, obj, detail]) => ({ at, actor, role, action, obj, detail }));

  return { tenant: { id: 'T-NB', name: 'Nümunə Bank ASC', env: 'TEST' }, sources, tables, scans, detectors, findings, reports, edges, lineageQueue, domains, terms, cdes, dqDefs, dqBinds, dqRuns, issues, access, gates, audit };
})();
