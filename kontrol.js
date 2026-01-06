const mongoose = require('mongoose');

// Burası şu anki server.js'deki adres
const uri = 'mongodb://127.0.0.1:27017/sawyers2el'; 

mongoose.connect(uri)
    .then(async () => {
        console.log("✅ Veritabanına Bağlandı!");
        
        // 'ilans' koleksiyonunu (tablosunu) kontrol et
        // Mongoose 'Ilan' modelini otomatik 'ilans' yapar.
        const connection = mongoose.connection;
        const collections = await connection.db.listCollections().toArray();
        
        console.log("\n📂 Mevcut Tablolar (Koleksiyonlar):");
        collections.forEach(c => console.log(` - ${c.name}`));

        // İlan Sayısını Bul
        const count = await connection.db.collection('ilans').countDocuments();
        console.log(`\n📊 'ilans' tablosundaki kayıt sayısı: ${count}`);

        if (count > 0) {
            const ornek = await connection.db.collection('ilans').findOne();
            console.log("\n🔎 Örnek Bir İlan Verisi:");
            console.log(ornek);
        } else {
            console.log("\n⚠️ Bu veritabanında hiç ilan görünmüyor.");
            console.log("Acaba eskiden veritabanı ismini 'sawyers2el' değil de başka bir şey mi yapmıştın?");
        }

        process.exit();
    })
    .catch(err => {
        console.error("Bağlantı Hatası:", err);
        process.exit();
    });