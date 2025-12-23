# Görev Yöneticisi v2 (Flask)

**YBS241 - Web Tasarım ve Geliştirme Ders Projesi**

Python Flask ile geliştirilmiş modern görev yönetim uygulaması.

## Özellikler

- Tam CRUD işlemleri (Oluştur, Oku, Güncelle, Sil)
- Kategori yönetimi
- Öncelik ve durum takibi
- Yönetim paneli
- Responsive tasarım
- SQLite veritabanı

## Kurulum

### 1. Sanal Ortam Oluştur (Önerilen)

```bash
cd gorev-yoneticisi-v2
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# veya
venv\Scripts\activate  # Windows
```

### 2. Bağımlılıkları Yükle

```bash
pip install -r requirements.txt
```

### 3. Uygulamayı Çalıştır

```bash
python app.py
```

### 4. Tarayıcıda Aç

- Ana Sayfa: http://localhost:5000
- Yönetim Paneli: http://localhost:5000/admin

## Proje Yapısı

```
gorev-yoneticisi-v2/
├── app.py                 # Ana Flask uygulaması
├── requirements.txt       # Python bağımlılıkları
├── database/
│   ├── __init__.py
│   ├── db.py              # Veritabanı işlemleri
│   └── gorevler.db        # SQLite veritabanı (otomatik oluşur)
├── templates/
│   ├── index.html         # Ana sayfa
│   └── admin.html         # Yönetim paneli
└── static/
    ├── css/
    │   ├── style.css      # Ana stil dosyası
    │   └── admin.css      # Admin panel stilleri
    └── js/
        ├── app.js         # Ana sayfa JavaScript
        └── admin.js       # Admin panel JavaScript
```

## API Endpoints

### Görevler
- `GET /api/tasks` - Tüm görevleri listele
- `GET /api/tasks/<id>` - Belirli görevi getir
- `POST /api/tasks` - Yeni görev oluştur
- `PUT /api/tasks/<id>` - Görevi güncelle
- `DELETE /api/tasks/<id>` - Görevi sil

### Kategoriler
- `GET /api/categories` - Tüm kategorileri listele
- `POST /api/categories` - Yeni kategori oluştur
- `PUT /api/categories/<id>` - Kategoriyi güncelle
- `DELETE /api/categories/<id>` - Kategoriyi sil

### Admin
- `GET /api/admin/dashboard` - Dashboard verileri
- `DELETE /api/admin/tasks/all` - Tüm görevleri sil
- `POST /api/admin/reset` - Veritabanını sıfırla

## Teknolojiler

- **Backend**: Python 3, Flask
- **Veritabanı**: SQLite3
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Font**: Inter (Google Fonts)

## Geliştirici

- Ders: YBS241 - Web Tasarım ve Geliştirme
- Tarih: 2025