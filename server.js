const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// --- 1. MIDDLEWARE KISMI ---
app.use(cors()); // Bu satırın olduğundan emin ol!
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// --- YENİ: ANA SAYFA ROTASI (Cannot GET / Hatasını çözer) ---
app.get('/', (req, res) => {
    res.send("<h1>SawyerS Backend Çalışıyor! 🚀</h1><p>Bu bir API sunucusudur.</p>");
});

// --- 2. MONGODB BAĞLANTISI ---
mongoose.connect('mongodb://127.0.0.1:27017/sawyers2el')
    .then(() => console.log('✅ Veritabanı Bağlantısı Başarılı!'))
    .catch(err => console.error('❌ Bağlantı Hatası:', err));

// --- 3. ŞEMALAR ---

// KULLANICI ŞEMASI (GÜNCELLENMİŞ: profileImage var)
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    favorites: [String],
    isAdmin: { type: Boolean, default: false },
    profileImage: { type: String, default: "" }, 
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// İLAN ŞEMASI
const IlanSchema = new mongoose.Schema({
    sellerId: String,
    title: String,
    price: Number,
    description: String,
    city: String,
    district: String,
    category: String,
    details: Object,
    date: { type: Date, default: Date.now },
    images: [String],
    contact: String,
    sellerName: String
});
const Ilan = mongoose.model('Ilan', IlanSchema);

// MESAJ ŞEMASI
const MessageSchema = new mongoose.Schema({
    senderId: String,
    receiverId: String,
    senderName: String,
    text: String,
    ilanId: String,
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);


// --- 4. DOSYA YÜKLEME (MULTER) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/') },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)) 
    }
});
const upload = multer({ storage: storage });


// --- 5. API ENDPOINTLERİ ---

// --- KULLANICI İŞLEMLERİ ---

// Kayıt Ol
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if(!email || !password) return res.status(400).json({ error: "Eksik bilgi." });
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Bu e-posta zaten kayıtlı!" });
        const isAdmin = (email === 'admin@sawyers.com');
        const newUser = new User({ name, email, password, isAdmin });
        await newUser.save();
        res.status(201).json({ message: "Kayıt başarılı!" });
    } catch (err) { res.status(500).json({ error: "Sunucu hatası." }); }
});

// Giriş Yap
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Kullanıcı bulunamadı!" });
        if (user.password !== password) return res.status(400).json({ error: "Şifre hatalı!" });
        res.json({ 
            message: "Giriş başarılı", 
            user: { _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } 
        });
    } catch (err) { res.status(500).json({ error: "Giriş işlemi başarısız." }); }
});

// Kullanıcı Bilgisi GETİR (Email ve Resim dahil)
app.get('/api/user/:userId', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(400).json({ error: "Geçersiz ID" });
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: "Kullanıcı yok" });
        res.json({ 
            _id: user._id, 
            name: user.name, 
            email: user.email,
            profileImage: user.profileImage, 
            favorites: user.favorites || [] 
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Kullanıcı Bilgilerini GÜNCELLE (Resim + Bilgi)
app.put('/api/user/:userId', upload.single('profileImage'), async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userId = req.params.userId;
        const updateData = { name: name, email: email };
        
        if (req.file) updateData.profileImage = req.file.filename;
        if (password && password.trim() !== "") updateData.password = password;

        if(email) {
            const existingUser = await User.findOne({ email: email });
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(400).json({ error: "Bu e-posta adresi zaten kullanımda!" });
            }
        }
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
        res.json({ message: "Profil güncellendi", user: updatedUser });
    } catch (err) { res.status(500).json({ error: "Güncelleme hatası" }); }
});


// --- İLAN İŞLEMLERİ ---

// İlan Ver
app.post('/api/ilan-ver', upload.array('photos', 10), async (req, res) => {
    try {
        const imageNames = req.files ? req.files.map(file => file.filename) : [];
        const yeniIlan = new Ilan({
            ...req.body,
            images: imageNames,
            price: Number(req.body.price)
        });
        await yeniIlan.save();
        res.status(201).json({ message: "İlan eklendi" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tüm İlanları Getir
app.get('/api/ilanlar', async (req, res) => {
    const ilanlar = await Ilan.find().sort({ date: -1 });
    res.json(ilanlar);
});

// Tekil İlan Getir
app.get('/api/ilanlar/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Geçersiz ID" });
        const ilan = await Ilan.findById(req.params.id);
        if (!ilan) return res.status(404).json({ error: "İlan bulunamadı." });
        res.json(ilan);
    } catch (err) { res.status(500).json({ error: "Sunucu hatası" }); }
});

// İlanı Düzenle
app.put('/api/ilanlar/:id', async (req, res) => {
    try {
        const ilanId = req.params.id;
        const updates = {};
        if(req.body.title) updates.title = req.body.title;
        if(req.body.price) updates.price = Number(req.body.price);
        if(req.body.description) updates.description = req.body.description;

        await Ilan.findByIdAndUpdate(ilanId, updates);
        res.json({ message: "İlan güncellendi." });
    } catch (err) { res.status(500).json({ error: "İlan güncellenemedi." }); }
});

// İlan Sil
app.delete('/api/ilanlar/:id/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        const ilan = await Ilan.findById(req.params.id);
        if(!user || !ilan) return res.status(404).json({error: "Veri bulunamadı"});

        if(user.isAdmin || ilan.sellerId === req.params.userId) {
            await Ilan.findByIdAndDelete(req.params.id);
            res.json({message: "Silindi"});
        } else { res.status(403).json({error: "Yetkisiz işlem"}); }
    } catch(e) { res.status(500).json({error: e.message}); }
});


// --- FAVORİ İŞLEMLERİ ---

// Favori Ekle/Çıkar
app.post('/api/favorites/toggle', async (req, res) => {
    try {
        const { userId, adId } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });
        if (!user.favorites) user.favorites = [];

        const index = user.favorites.indexOf(adId);
        if (index === -1) {
            user.favorites.push(adId);
            await user.save();
            res.json({ message: "Eklendi", status: "added", favorites: user.favorites });
        } else {
            user.favorites.splice(index, 1);
            await user.save();
            res.json({ message: "Çıkarıldı", status: "removed", favorites: user.favorites });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Favorileri Getir
app.get('/api/favorites/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });
        const favoriIlanlar = await Ilan.find({ _id: { $in: user.favorites } });
        res.json(favoriIlanlar);
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// --- MESAJLAŞMA İŞLEMLERİ ---

// Mesaj Gönder
app.post('/api/messages/send', async (req, res) => {
    try {
        const { senderId, receiverId, text, senderName, ilanId } = req.body;
        const newMsg = new Message({ senderId, receiverId, text, senderName, ilanId });
        await newMsg.save();
        res.json(newMsg);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Sohbet Geçmişi
app.get('/api/messages/chat/:user1/:user2', async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { senderId: req.params.user1, receiverId: req.params.user2 },
                { senderId: req.params.user2, receiverId: req.params.user1 }
            ]
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Inbox (Konuşulan Kişiler)
app.get('/api/messages/inbox/:myId', async (req, res) => {
    try {
        const myId = req.params.myId;
        const allMyMessages = await Message.find({
            $or: [{ senderId: myId }, { receiverId: myId }]
        }).sort({ createdAt: -1 });

        const contactMap = new Map();
        for (let msg of allMyMessages) {
            const otherUserId = msg.senderId === myId ? msg.receiverId : msg.senderId;
            if (!contactMap.has(otherUserId)) {
                const user = await User.findById(otherUserId);
                if (user) {
                    contactMap.set(otherUserId, {
                        id: otherUserId,
                        name: user.name,
                        lastMsg: msg.text,
                        time: msg.createdAt
                    });
                }
            }
        }
        res.json(Array.from(contactMap.values()));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Sunucuyu Başlat
app.listen(PORT, () => {
    console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`);
});