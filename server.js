const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/marketplace_db')
    .then(() => console.log("Connecté à la marketplace MongoDB"))
    .catch(err => console.error(err));

// Modèle Categories
const categoriesSchema = new mongoose.Schema({
    nom: { type: String, enum: ["Processeurs", "Cartes graphiques", "Accessoire"], default: "Accessoire", required: true },
});
const Categories = mongoose.model('Categories', categoriesSchema);

// Modèle Products (avec référence vers Categories)
const productsSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prix: { type: String, required: true },
    stock: { type: Number, required: true },
    categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Categories'}
});
const Products = mongoose.model('Products', productsSchema);

// Modèle Users
const usersSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ["Client", "Admin"], default: "Client", required: true },
});
const Users = mongoose.model('Users', usersSchema);

// Modèle Reviews (avec référence vers Products et Users)
const reviewsSchema = new mongoose.Schema({
    commentaire: { type: String, required: true },
    note: { type: Number, enum: [1, 2, 3, 4, 5], default: 5, required: true },
    produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Products' },
    auteur: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' }
});
const Reviews = mongoose.model('Reviews', reviewsSchema);


// --- ROUTES GESTION DU CATALOGUE ---

// Retourne tous les produits avec le détail de leur catégorie
app.get('/api/products', async (req, res) => {
    const list = await Products.find().populate('categorie');
    res.json(list);
});

// Ajoute un produit (Vérifier que le prix est positif).
app.post('/api/products', async (req, res) => {
    try {
        if (req.body.prix <= 0) {
            return res.status(400).json({ message: "Le prix doit être positif" });
        }
        const nouveauProduit = new Products(req.body);
        await nouveauProduit.save();
        res.status(201).json(nouveauProduit);
    } catch (err) {
        res.status(400).json({ error: "Données invalides" });
    }
});



// --- ROUTES SYSTEME D'AVIS ---

// Permet à un utilisateur de laisser une note sur un produit
app.post('/api/reviews', async (req, res) => {
    try {
        const nouvelleNote = new Reviews(req.body);
        await nouvelleNote.save();
        res.status(201).json(nouvelleNote);
    } catch (err) {
        res.status(400).json({ error: "Données invalides" });
    }
});

// Récupère tous les avis d'un produit spécifique avec le nom de l'auteur 
app.get('/api/reviews', async (req, res) => {
    const reviews = await Reviews.find()
        .populate('auteur', 'username') // Récupère juste le nom de l'auteur
        .populate({
            path: 'produit',
            populate: { path: 'categorie' } // Récupère la catégorie à l'intérieur du produit
        });
    res.json(reviews);
});

app.get('/api/reviews/:productId', async (req, res) => {
    try {
        const reviews = await Reviews.find()
        .populate({
            path: 'produit',
            populate: { path: '_id' } // Récupère l'id à l'intérieur du produit
        }); 
        productId = '_id'
        if (reviewById == productId) {
            res.json(reviewById);
        }
    } catch(err) {
        res.status(400).json({ error: "Produit introuvable" });
    }
});

app.get('/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const livre = livres.find(b => b.id === id);
    if (livre) {
        res.json(livre);
    } else {
        res.status(404).send({ message: "Livre non trouvé" });
    }   
});



// --- ROUTES GESTION UTILISATEURS --- 

// Crée un nouvel utilisateur
app.post('/api/users', async (req, res) => {
    try {
        const user = new Users(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (err) { res.status(400).json({ error: "Email déjà utilisé" }); }
});


// --- ROUTES SUPPRESSION PRODUIT ---

// Supprimé un produit et tous les Reviews associés à ce produit
app.delete('/api/products/:id', async (req, res) => {
    try {
        const idProduitReviews = await Reviews.find()
        .populate({
            path: 'produit',
            populate: { path: '_id' } // Récupère l'id à l'intérieur du produit
        });
        idProduitReviews.remove();
        res.json({ message: "Produit supprimé des avis" });

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Produit supprimé avec succès" });

    } catch (err) {
        res.status(404).json({ error: "Produit introuvable" });
    }
});



app.listen(3000, () => console.log("Serveur Garage sur port 3000"));