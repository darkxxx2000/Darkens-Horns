// =====================================================================
//  SITE SETTINGS. The posts themselves are uploaded from admin.html.
// =====================================================================
window.SITE = {
  name: 'My',                      // first part of the logo
  highlight: 'Catalog',            // second part (shown in the accent color)
  tagline: 'My collection',        // browser tab text
  searchPlaceholder: 'Search by title, series or character…',
  description: 'Comics, galleries, posts, light novels and videos.',

  // Shown in the "Contact" tab. Links must start with https://
  contact: {
    text: '',                      // e.g. 'Business inquiries and collaborations.'
    email: '',                     // e.g. 'hello@example.com'
    links: []                      // e.g. [{ label: 'Instagram', url: 'https://instagram.com/yourname' }]
  },

  // Sign-in, likes and comments (Firebase). Fill these 4 values from the
  // Firebase console (Project settings → Your apps → Web app). Leave empty to disable.
  firebase: { apiKey: '', authDomain: '', projectId: '', appId: '' }
};

// Optional: posts written by hand (they are added to the ones from the admin panel).
window.CATALOGO = [];
