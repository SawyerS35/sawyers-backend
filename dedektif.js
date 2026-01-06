const mongoose = require('mongoose');

// Dolu olduğunu bildiğimiz veritabanına bağlanıyoruz
const uri = 'mongodb://127.0.0.1:27017/sawyers2el'; 

mongoose.connect(uri)
    .then(async () => {
        console.log("✅ sawyers2el Veritabanına Girildi!\n");

        const connection = mongoose.connection;
        
        // Bütün tablo (koleksiyon) isimlerini çek
        const collections = await connection.db.listCollections().toArray();
        
        console.log("📂 BULUNAN TABLOLAR VE İÇERİK SAYILARI:");
        console.log("-----------------------------------------");

        if (collections.length === 0) {
            console.log("❌ Hiç tablo bulunamadı. Veritabanı dosyası var ama içi boş görünüyor.");
        }

        for (let col of collections) {
            const count = await connection.db.collection(col.name).countDocuments();
            console.log(`📄 Tablo Adı: '${col.name}' \t-> İçindeki Veri Sayısı: ${count}`);
            
            // Eğer içinde veri varsa bir tane örnek göster
            if (count > 0) {
                const ornek = await connection.db.collection(col.name).findOne();
                console.log(`   ↳ Örnek Veri ID'si: ${ornek._id}`);
                // İlan başlığı varsa yazdır
                if(ornek.title) console.log(`   ↳ Başlık: ${ornek.title}`);
                if(ornek.name) console.log(`   ↳ İsim: ${ornek.name}`);
                console.log("-----------------------------------------");
            }
        }

        process.exit();
    })
    .catch(err => {
        console.error("Hata:", err);
        process.exit();
    });