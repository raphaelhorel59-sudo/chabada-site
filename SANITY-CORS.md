# Connexion du site public à Sanity (API)

Les contenus du menu sont lus depuis le projet Sanity **`ehmw6xk5`** (dataset `production`) via l’API CDN dans le navigateur (`js/menu.sanity.js`).

Pour que le navigateur puisse appeler `*.sanity.io` depuis ton domaine, il faut autoriser l’origine dans Sanity.

## À faire une fois dans Sanity

1. Va sur [sanity.io/manage](https://www.sanity.io/manage) et ouvre le projet **Chabada** (`ehmw6xk5`).
2. Menu **API** → section **CORS origins**.
3. Ajoute exactement :
   - `http://localhost:8000` (développement local)
   - l’URL de production du site (ex. `https://chabada.vercel.app`)
4. Enregistre.

## Vérification

- Ouvre **carte.html** : les plats publiés dans Sanity pour **Entrées, Plats, Desserts, Cocktails** doivent s’afficher.
- Si un message d’erreur s’affiche, ouvre la console (F12) : une erreur réseau ou CORS confirme que l’origine manque encore dans Sanity.

## Catégories « Vins » et « Spiritueux »

Elles ne sont pas encore dans le schéma Sanity « plat » : elles ne sont plus affichées sur cette version tant que le schéma n’est pas étendu.
