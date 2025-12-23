from flask import Flask, render_template, request, jsonify
from database.db import (
    init_db, reset_db,
    get_all_tasks, get_task_by_id, create_task, update_task, delete_task, delete_all_tasks, get_task_stats,
    get_all_categories, get_category_by_id, create_category, update_category, delete_category,
    get_dashboard_data
)

app = Flask(__name__)

# Veritabanını başlat
init_db()

# ============================================
# SAYFA ROUTE'LARI
# ============================================

@app.route('/')
def index():
    """Ana sayfa"""
    return render_template('index.html')

@app.route('/admin')
def admin():
    """Admin paneli"""
    return render_template('admin.html')

# ============================================
# GÖREV API'LERİ
# ============================================

@app.route('/api/tasks', methods=['GET'])
def api_get_tasks():
    """Tüm görevleri getir"""
    try:
        tasks = get_all_tasks()
        return jsonify({'basarili': True, 'gorevler': tasks})
    except Exception as e:
        return jsonify({'basarili': False, 'hata': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
def api_get_task(task_id):
    """Belirli bir görevi getir"""
    try:
        task = get_task_by_id(task_id)
        if task:
            return jsonify({'basarili': True, 'gorev': task})
        return jsonify({'basarili': False, 'hata': 'Görev bulunamadı'}), 404
    except Exception as e:
        return jsonify({'basarili': False, 'hata': str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
def api_create_task():
    """Yeni görev oluştur"""
    try:
        data = request.get_json()

        if not data.get('baslik'):
            return jsonify({'basarili': False, 'hata': 'Başlık gereklidir'}), 400

        task_id = create_task(data)
        task = get_task_by_id(task_id)

        return jsonify({
            'basarili': True,
            'mesaj': 'Görev başarıyla oluşturuldu',
            'gorev': task
        }), 201
    except Exception as e:
        return jsonify({'basarili': False, 'hata': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def api_update_task(task_id):
    """Görevi güncelle"""
    try:
        data = request.get_json()

        if not get_task_by_id(task_id):
            return jsonify({'basarili': False, 'hata': 'Görev bulunamadı'}), 404

        update_task(task_id, data)
        task = get_task_by_id(task_id)

        return jsonify({
            'basarili': True,
            'mesaj': 'Görev başarıyla güncellendi',
            'gorev': task
        })
    except Exception as e:
        return jsonify({'basarili': False, 'hata': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def api_delete_task(task_id):
    """Görevi sil"""
    try:
        if not get_task_by_id(task_id):
            return jsonify({'basarili': False, 'hata': 'Görev bulunamadı'}), 404

        delete_task(task_id)

        return jsonify({
            'basarili': True,
            'mesaj': 'Görev başarıyla silindi'
        })
    except Exception as e:
        return jsonify({'basarili': False, 'hata': str(e)}), 500

@app.route('/api/tasks/stats', methods=['GET'])
def api_get_stats():
    """Görev istatistiklerini getir"""
    try:
        stats = get_task_stats()
        return jsonify({'basarili': True, 'istatistikler': stats})
    except Exception as e:
        return jsonify({'basarili': False, 'hata': str(e)}), 500

# ============================================
# KATEGORİ API'LERİ
# ============================================

@app.route('/api/categories', methods=['GET'])
def api_get_categories():
    """Tüm kategorileri getir"""
    try:
        categories = get_all_categories()
        return jsonify({'basarili': True, 'kategoriler': categories})
    except Exception as e:
        return jsonify({'basarili': False, 'hata': str(e)}), 500

@app.route('/api/categories/<int:category_id>', methods=['GET'])
def api_get_category(category_id):
    """Belirli bir kategoriyi getir"""
    try:
        category = get_category_by_id(category_id)
        if category:
            return jsonify({'basarili': True, 'kategori': category})
        return jsonify({'basarili': False, 'hata': 'Kategori bulunamadı'}), 404
    except Exception as e:
        return jsonify({'basarili': False, 'hata': str(e)}), 500

@app.route('/api/categories', methods=['POST'])
def api_create_category():
    """Yeni kategori oluştur"""
    try:
        data = request.get_json()

        if not data.get('ad'):
            return jsonify({'basarili': False, 'hata': 'Kategori adı gereklidir'}), 400

        category_id = create_category(data)

        if category_id is None:
            return jsonify({'basarili': False, 'hata': 'Bu kategori adı zaten mevcut'}), 400

        category = get_category_by_id(category_id)

        return jsonify({
            'basarili': True,
            'mesaj': 'Kategori başarıyla oluşturuldu',
            'kategori': category
        }), 201
    except Exception as e:
        return jsonify({'basarili': False, 'hata': str(e)}), 500

@app.route('/api/categories/<int:category_id>', methods=['PUT'])
def api_update_category(category_id):
    """Kategoriyi güncelle"""
    try:
        data = request.get_json()

        category = get_category_by_id(category_id)
        if not category:
            return jsonify({'basarili': False, 'hata': 'Kategori bulunamadı'}), 404

        # Mevcut değerleri koru
        if 'ad' not in data:
            data['ad'] = category['ad']
        if 'renk' not in data:
            data['renk'] = category['renk']

        update_category(category_id, data)
        updated_category = get_category_by_id(category_id)

        return jsonify({
            'basarili': True,
            'mesaj': 'Kategori başarıyla güncellendi',
            'kategori': updated_category
        })
    except Exception as e:
        return jsonify({'basarili': False, 'hata': str(e)}), 500

@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
def api_delete_category(category_id):
    """Kategoriyi sil"""
    try:
        if not get_category_by_id(category_id):
            return jsonify({'basarili': False, 'hata': 'Kategori bulunamadı'}), 404

        delete_category(category_id)

        return jsonify({
            'basarili': True,
            'mesaj': 'Kategori başarıyla silindi'
        })
    except Exception as e:
        return jsonify({'basarili': False, 'hata': str(e)}), 500

# ============================================
# ADMİN API'LERİ
# ============================================

@app.route('/api/admin/dashboard', methods=['GET'])
def api_admin_dashboard():
    """Admin dashboard verilerini getir"""
    try:
        dashboard = get_dashboard_data()
        return jsonify({'basarili': True, 'dashboard': dashboard})
    except Exception as e:
        return jsonify({'basarili': False, 'hata': str(e)}), 500

@app.route('/api/admin/tasks/all', methods=['DELETE'])
def api_delete_all_tasks():
    """Tüm görevleri sil"""
    try:
        count = delete_all_tasks()
        return jsonify({
            'basarili': True,
            'mesaj': f'{count} görev başarıyla silindi'
        })
    except Exception as e:
        return jsonify({'basarili': False, 'hata': str(e)}), 500

@app.route('/api/admin/reset', methods=['POST'])
def api_reset_database():
    """Veritabanını sıfırla"""
    try:
        reset_db()
        return jsonify({
            'basarili': True,
            'mesaj': 'Veritabanı başarıyla sıfırlandı'
        })
    except Exception as e:
        return jsonify({'basarili': False, 'hata': str(e)}), 500

# ============================================
# UYGULAMA BAŞLATMA
# ============================================

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Görev Yöneticisi v2 (Flask) Başlatılıyor...")
    print("=" * 50)
    print("📍 Ana Sayfa: http://localhost:5001")
    print("📍 Admin Panel: http://localhost:5001/admin")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5001)
