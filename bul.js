const mongoose = require('mongoose');

// Admin yetkisiyle bağlanıp tüm listeyi çekeceğiz
const uri = 'mongodb://127.0.0.1:27017/admin'; 

mongoose.connect(uri)
    .then(async () => {
        console.log("✅ Bağlantı kuruldu, veritabanları taranıyor...\n");

        const admin = mongoose.connection.db.admin();
        const result = await admin.listDatabases();
        
        console.log("📂 MEVCUT VERİTABANLARI LİSTESİ:");
        console.log("--------------------------------");
        
        // Hepsini yazdır
        result.databases.forEach(db => {
            // 'admin', 'config', 'local' sistem dosyalarıdır, onları boşver.
            // Onların dışındakiler senin eski verilerin olabilir.
            const boyut = (db.sizeOnDisk / 1024).toFixed(2); // KB cinsinden
            console.log(`💾 İsim: ${db.name} \t\t(Boyut: ${boyut} KB)`);
        });

        console.log("\n--------------------------------");
        console.log("İPUCU: Genellikle 'test' isminde olabilir.");
        
        process.exit();
    })
    .catch(err => {
        console.error("Hata:", err);
        process.exit();
    });