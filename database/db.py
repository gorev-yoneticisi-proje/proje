import sqlite3
import os
from datetime import datetime

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'gorevler.db')

def get_db_connection():
    """Veritabanı bağlantısı oluştur"""
    conn = sqlite3.connect(DATABASE_PATH, timeout=10, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA journal_mode=WAL')  # Better concurrency
    return conn

def init_db():
    """Veritabanını başlat ve tabloları oluştur"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Kategoriler tablosu
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS kategoriler (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ad TEXT NOT NULL UNIQUE,
            renk TEXT DEFAULT '#3498db',
            olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Görevler tablosu
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gorevler (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            baslik TEXT NOT NULL,
            aciklama TEXT,
            kategori_id INTEGER,
            oncelik TEXT CHECK(oncelik IN ('düşük', 'orta', 'yüksek')) DEFAULT 'orta',
            durum TEXT CHECK(durum IN ('beklemede', 'devam-ediyor', 'tamamlandı')) DEFAULT 'beklemede',
            bitis_tarihi DATE,
            olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
            guncelleme_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (kategori_id) REFERENCES kategoriler(id) ON DELETE SET NULL
        )
    ''')

    # Varsayılan kategorileri ekle
    varsayilan_kategoriler = [
        ('Kişisel', '#3498db'),
        ('İş', '#e74c3c'),
        ('Okul', '#2ecc71'),
        ('Alışveriş', '#f39c12'),
        ('Diğer', '#95a5a6')
    ]

    for ad, renk in varsayilan_kategoriler:
        try:
            cursor.execute('INSERT INTO kategoriler (ad, renk) VALUES (?, ?)', (ad, renk))
        except sqlite3.IntegrityError:
            pass  # Kategori zaten var

    conn.commit()
    conn.close()
    print("Veritabanı başarıyla başlatıldı!")

def reset_db():
    """Veritabanını sıfırla"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('DELETE FROM gorevler')
    cursor.execute('DELETE FROM kategoriler')
    cursor.execute('DELETE FROM sqlite_sequence WHERE name="gorevler"')
    cursor.execute('DELETE FROM sqlite_sequence WHERE name="kategoriler"')

    # Varsayılan kategorileri tekrar ekle
    varsayilan_kategoriler = [
        ('Kişisel', '#3498db'),
        ('İş', '#e74c3c'),
        ('Okul', '#2ecc71'),
        ('Alışveriş', '#f39c12'),
        ('Diğer', '#95a5a6')
    ]

    for ad, renk in varsayilan_kategoriler:
        cursor.execute('INSERT INTO kategoriler (ad, renk) VALUES (?, ?)', (ad, renk))

    conn.commit()
    conn.close()

# Görev İşlemleri
def get_all_tasks():
    """Tüm görevleri getir"""
    conn = get_db_connection()
    tasks = conn.execute('''
        SELECT g.*, k.ad as kategori_adi, k.renk as kategori_renk
        FROM gorevler g
        LEFT JOIN kategoriler k ON g.kategori_id = k.id
        ORDER BY g.olusturma_tarihi DESC
    ''').fetchall()
    conn.close()
    return [dict(row) for row in tasks]

def get_task_by_id(task_id):
    """ID'ye göre görev getir"""
    conn = get_db_connection()
    task = conn.execute('''
        SELECT g.*, k.ad as kategori_adi, k.renk as kategori_renk
        FROM gorevler g
        LEFT JOIN kategoriler k ON g.kategori_id = k.id
        WHERE g.id = ?
    ''', (task_id,)).fetchone()
    conn.close()
    return dict(task) if task else None

def create_task(data):
    """Yeni görev oluştur"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO gorevler (baslik, aciklama, kategori_id, oncelik, durum, bitis_tarihi)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        data.get('baslik'),
        data.get('aciklama'),
        data.get('kategori_id'),
        data.get('oncelik', 'orta'),
        data.get('durum', 'beklemede'),
        data.get('bitis_tarihi')
    ))

    task_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return task_id

def update_task(task_id, data):
    """Görevi güncelle - sadece verilen alanları günceller"""
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Mevcut görevi al
        existing = cursor.execute('SELECT * FROM gorevler WHERE id = ?', (task_id,)).fetchone()
        if not existing:
            conn.close()
            return False

        existing = dict(existing)

        # Sadece verilen alanları güncelle, yoksa mevcut değeri koru
        baslik = data.get('baslik', existing['baslik'])
        aciklama = data.get('aciklama', existing['aciklama'])
        kategori_id = data.get('kategori_id', existing['kategori_id'])
        oncelik = data.get('oncelik', existing['oncelik'])
        durum = data.get('durum', existing['durum'])
        bitis_tarihi = data.get('bitis_tarihi', existing['bitis_tarihi'])

        cursor.execute('''
            UPDATE gorevler
            SET baslik = ?, aciklama = ?, kategori_id = ?, oncelik = ?, durum = ?,
                bitis_tarihi = ?, guncelleme_tarihi = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (baslik, aciklama, kategori_id, oncelik, durum, bitis_tarihi, task_id))

        changes = cursor.rowcount
        conn.commit()
        return changes > 0
    finally:
        conn.close()

def delete_task(task_id):
    """Görevi sil"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM gorevler WHERE id = ?', (task_id,))
        changes = cursor.rowcount
        conn.commit()
        return changes > 0
    finally:
        conn.close()

def delete_all_tasks():
    """Tüm görevleri sil"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM gorevler')
        changes = cursor.rowcount
        conn.commit()
        return changes
    finally:
        conn.close()

def get_task_stats():
    """Görev istatistiklerini getir"""
    conn = get_db_connection()
    try:
        stats = {
            'toplam': conn.execute('SELECT COUNT(*) FROM gorevler').fetchone()[0],
            'tamamlanan': conn.execute("SELECT COUNT(*) FROM gorevler WHERE durum = 'tamamlandı'").fetchone()[0],
            'bekleyen': conn.execute("SELECT COUNT(*) FROM gorevler WHERE durum = 'beklemede'").fetchone()[0],
            'devam_eden': conn.execute("SELECT COUNT(*) FROM gorevler WHERE durum = 'devam-ediyor'").fetchone()[0]
        }

        # Kategori bazlı istatistikler
        kategori_stats = conn.execute('''
            SELECT k.ad, COUNT(g.id) as gorev_sayisi
            FROM kategoriler k
            LEFT JOIN gorevler g ON k.id = g.kategori_id
            GROUP BY k.id
        ''').fetchall()

        stats['kategoriler'] = [dict(row) for row in kategori_stats]
        return stats
    finally:
        conn.close()

# Kategori İşlemleri
def get_all_categories():
    """Tüm kategorileri getir"""
    conn = get_db_connection()
    try:
        categories = conn.execute('SELECT * FROM kategoriler ORDER BY id').fetchall()
        return [dict(row) for row in categories]
    finally:
        conn.close()

def get_category_by_id(category_id):
    """ID'ye göre kategori getir"""
    conn = get_db_connection()
    try:
        category = conn.execute('SELECT * FROM kategoriler WHERE id = ?', (category_id,)).fetchone()
        return dict(category) if category else None
    finally:
        conn.close()

def create_category(data):
    """Yeni kategori oluştur"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO kategoriler (ad, renk) VALUES (?, ?)
        ''', (data.get('ad'), data.get('renk', '#3498db')))
        category_id = cursor.lastrowid
        conn.commit()
        return category_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def update_category(category_id, data):
    """Kategoriyi güncelle"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE kategoriler SET ad = ?, renk = ? WHERE id = ?
        ''', (data.get('ad'), data.get('renk'), category_id))
        changes = cursor.rowcount
        conn.commit()
        return changes > 0
    finally:
        conn.close()

def delete_category(category_id):
    """Kategoriyi sil"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # Önce bu kategorideki görevlerin kategori_id'sini NULL yap
        cursor.execute('UPDATE gorevler SET kategori_id = NULL WHERE kategori_id = ?', (category_id,))
        cursor.execute('DELETE FROM kategoriler WHERE id = ?', (category_id,))
        changes = cursor.rowcount
        conn.commit()
        return changes > 0
    finally:
        conn.close()

# Dashboard verisi
def get_dashboard_data():
    """Admin dashboard verilerini getir"""
    stats = get_task_stats()

    conn = get_db_connection()
    try:
        recent_tasks = conn.execute('''
            SELECT g.*, k.ad as kategori_adi, k.renk as kategori_renk
            FROM gorevler g
            LEFT JOIN kategoriler k ON g.kategori_id = k.id
            ORDER BY g.olusturma_tarihi DESC
            LIMIT 50
        ''').fetchall()

        return {
            'istatistikler': stats,
            'son_gorevler': [dict(row) for row in recent_tasks],
            'kategoriler': get_all_categories()
        }
    finally:
        conn.close()

if __name__ == '__main__':
    init_db()
