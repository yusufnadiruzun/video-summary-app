// src/pages/_app.tsx (veya .jsx)

// 💡 1. Adım: Global CSS dosyanızın doğru yolunu import edin.
// Yol, projenizin kurulu olduğu yere göre değişebilir.
// Aşağıdaki örnekte CSS dosyanızın 'src/styles/globals.css' içinde olduğunu varsayıyorum.
import '../globals.css'; 
// Veya eğer globals.css, pages klasörünün hemen yanındaysa: import '../globals.css';

function MyApp({ Component, pageProps }) {
  // `Component` şu anda görüntülenen sayfadır (SignIn, Checkout, Index vb.).
  return <Component {...pageProps} />;
}

export default MyApp;