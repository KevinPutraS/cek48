import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import TopBar from "../components/TopBar";
import "../styles/news-detail.css";

export default function NewsDetailPage() {
  const { slug } = useParams(); 
  const navigate = useNavigate();
  
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNewsDetail();
  }, [slug]);

  async function loadNewsDetail() {
    try {
      setLoading(true);
      setError("");
      
      const cacheKey = `jkt48_news_${slug}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isCacheValid = (Date.now() - timestamp) < 300000;
        
        if (isCacheValid) {
          setDetail(data);
          setLoading(false);
          return;
        }
      }

      const response = await fetch(
        `/api/jkt48-news-detail?slug=${encodeURIComponent(slug)}`
      );
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server tidak mengembalikan respons JSON.");
      }

      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "Gagal memuat rincian isi pengumuman.");
      }

      const dataPayload = json.data?.data || json.data;

      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: dataPayload,
        timestamp: Date.now()
      }));

      setDetail(dataPayload); 

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getCategoryAccent(category) {
    const cat = category?.toLowerCase() || "";
    if (cat.includes("theater") || cat.includes("teater")) return "#ff4f9a";
    if (cat.includes("event")) return "#42d5f5";
    if (cat.includes("merchandise")) return "#ffd369";
    return "#806cff"; 
  }

  function cleanArticle(html = "") {
    let clean = DOMPurify.sanitize(html);

    // 1. Regex Pembersih Awal
    // Hapus enter/newline tersembunyi bawaan server
    clean = clean.replace(/(\r\n|\n|\r)/gm, "");
    // Ganti tumpukan <br> menjadi maksimal 1 <br>
    clean = clean.replace(/(<br\s*\/?>\s*){2,}/gi, "<br>");
    // Hapus <p> atau <div> yang isinya cuma spasi atau <br>
    clean = clean.replace(/<(p|div)[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/(p|div)>/gi, "");

    const doc = new DOMParser().parseFromString(clean, "text/html");

    // 2. Pembersihan Atribut
    doc.querySelectorAll("*").forEach((el) => {
      el.removeAttribute("class");
      el.removeAttribute("id");
      el.removeAttribute("style");
    });

    // 3. PEMBASMI SPASI (DOM Traversal)
    doc.querySelectorAll("p, div, span").forEach((el) => {
      const text = el.textContent.trim();
      const hasImg = el.querySelector("img") !== null;
      // Jika elemen ini benar-benar tidak ada teksnya DAN tidak ada gambar, HAPUS!
      if (text === "" && !hasImg) {
        el.remove();
      }
    });

    // Hapus <br> yang nyangkut di awal atau akhir paragraf (karena ini bikin jarak ekstra)
    doc.querySelectorAll("p > br:first-child, p > br:last-child").forEach(br => br.remove());

    // 4. Modifikasi Gambar
    doc.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (src && src.includes("jkt48.com")) {
        img.src = `/api/jkt48-image?url=${encodeURIComponent(src)}`;
      }
      img.removeAttribute("width");
      img.removeAttribute("height");
      
      img.setAttribute(
        "style",
        "width: 100% !important; height: auto !important; object-fit: contain !important; background-color: #ffffff !important; padding: 10px !important; margin: 1.5rem 0 !important; display: block !important; border-radius: 12px !important; border: 1px solid rgba(255,255,255,0.075) !important;"
      );
    });

    return doc.body.innerHTML;
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: detail.title,
          text: `Lihat pengumuman JKT48: ${detail.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Gagal membagikan:", err);
      }
    } else {
      alert("Browser Anda tidak mendukung fitur berbagi.");
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link berita telah disalin ke clipboard!");
    } catch (err) {
      console.error("Gagal menyalin:", err);
    }
  }

  return (
    <div className="app-shell">
      <TopBar
        sectionLabel="NEWS DETAIL"
        sectionDescription="Detail pengumuman resmi JKT48"
        showControls={false}
      />

      <main id="main-content" className="ns-layout">
        <div className="ns-container">
          
          {loading && (
            <div className="ns-status-msg">
              <span className="ns-spinner" />
              <p>Memuat pengumuman...</p>
            </div>
          )}

          {error && (
            <div className="ns-status-msg is-error">
              <p>{error}</p>
              <button className="ns-btn" onClick={loadNewsDetail}>Coba Lagi</button>
            </div>
          )}

          {!loading && !error && detail && (
            <article 
              className="ns-article-card" 
              style={{ "--ns-accent": getCategoryAccent(detail.category) }}
            >
              
              <h1 className="ns-title">{detail.title}</h1>

              <div className="ns-meta">
                <span className="ns-badge">
                  <i className="ns-dot"></i> {detail.category}
                </span>
                <span className="ns-date">
                  {new Date(detail.valid_date_from).toLocaleDateString("id-ID", { 
                    day: "numeric", month: "long", year: "numeric" 
                  })}
                  {detail.news_id && ` • ID: #${detail.news_id}`}
                </span>
              </div>

              <div className="ns-actions-row">
                <button className="ns-btn ns-back-btn" onClick={() => navigate("/news")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>
                <div className="ns-share-group">
                  <button className="ns-btn" onClick={handleShare}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
                    </svg>
                    Share
                  </button>
                  <button className="ns-btn" onClick={handleCopy}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                  </button>
                </div>
              </div>

              {detail.background_image && (
                <figure className="ns-hero">
                  <img src={detail.background_image} alt={detail.title} />
                </figure>
              )}

              <div
                className="ns-content-body"
                dangerouslySetInnerHTML={{
                  __html: cleanArticle(
                    detail.content || detail.body || detail.html || "<p>Pengumuman ini tidak memiliki rincian teks tambahan.</p>"
                  ),
                }}
              />

              {/* FOOTER BARU (Hanya Kategori & Sumber) */}
              <footer className="ns-article-footer">
                
                {/* 1. Kategori */}
                <div className="ns-footer-item">
                  <div className="ns-fi-icon" style={{ borderColor: "var(--ns-accent)", color: "var(--ns-accent)", background: "rgba(255,255,255,0.03)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <div className="ns-fi-text">
                    <span>Kategori</span>
                    <strong style={{ color: "var(--ns-accent)" }}>{detail.category}</strong>
                  </div>
                </div>

                {/* 2. Sumber Link */}
                <div className="ns-footer-item">
                  <div className="ns-fi-icon" style={{ borderColor: "var(--ns-accent)", color: "var(--ns-accent)", background: "rgba(255,255,255,0.03)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </div>
                  <div className="ns-fi-text">
                    <span>Sumber</span>
                    {/* FIX: Format URL JKT48 yang baru menggunakan slug langsung */}
                    <a 
                      href={`https://jkt48.com/news/${slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: "var(--ns-accent)" }}
                    >
                      jkt48.com
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  </div>
                </div>

              </footer>

            </article>
          )}

        </div>
      </main>
    </div>
  );
}