// Firebase Configuration
const firebaseSettings = {
  apiKey: "AIzaSyDfIqRZcSTqT7s1w3NNq1yZoQyrcdKOjF8",
  authDomain: "suhani-96c78.firebaseapp.com",
  projectId: "suhani-96c78",
  storageBucket: "suhani-96c78.appspot.com",
  messagingSenderId: "275036106574",
  appId: "1:275036106574:web:c6f769e038aa89795f781f"
};

// Initialize Firebase
firebase.initializeApp(firebaseSettings);
const firestoreDB = firebase.firestore();

// App Configuration
const ITEMS_PER_PAGE = 10;
let lastDoc = null;
let isLoading = false;
let canLoadMore = true;

// DOM Elements
const shayariContainer = document.getElementById('Poetry1');
const loadMoreButton = document.getElementById('load-more-btn');

// Load Initial Content
document.addEventListener('DOMContentLoaded', () => {
  fetchShayari(true);
  registerServiceWorker();
});

// Load More Handler
loadMoreButton.addEventListener('click', () => fetchShayari(false));

async function fetchShayari(isFirstLoad = true) {
  if (isLoading || !canLoadMore) return;
  isLoading = true;
  loadMoreButton.disabled = true;

  try {
      let query = firestoreDB.collection("Poetry").orderBy("createdAt", "asc")
          .limit(ITEMS_PER_PAGE);

      if (!isFirstLoad && lastDoc) {
          query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
          canLoadMore = false;
          loadMoreButton.hidden = true;
          return;
      }

      if (isFirstLoad) shayariContainer.innerHTML = '';
      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      snapshot.forEach(doc => {
          const data = doc.data();
          shayariContainer.appendChild(generateShayariCard(data));
      });

  } catch (error) {
      console.error("Error loading shayari:", error);
      displayError("Failed to load content. Please try again.");
  } finally {
      isLoading = false;
      loadMoreButton.disabled = false;
  }
}

// Generate Shayari Card
function generateShayariCard(data) {
  const cardElement = document.createElement('div');
  cardElement.className = 'col-md-8 mb-4';

  // Validate and sanitize data
  const safeContent = {
      id: data.id || 'unknown-id',
      title: sanitizeText(data.title) || 'Untitled Shayari',
      text: sanitizeText(data.shayri || data.content) || 'Content not available',
      image: validateImageUrl(data.imageUrl)
  };

  cardElement.innerHTML = `
      <section class="shayari" id="shayari-${safeContent.id}">
          <h2>${safeContent.title}</h2>
          <div class="shayari-content">
             <p>${safeContent.text.replace(/&lt;br\s*\/?&gt;/g, "<br>").replace(/<br\s*\/?>/g, "<br>")}</p>
          </div>
          
          <div class="button-group">
              <button class="download-btn" onclick="downloadShayari('${safeContent.id}')">
                   🖼️ With Background
              </button>
              <button class="download-btn" onclick="downloadShayariOnBackground('${safeContent.id}')">
                  📥 Download
              </button>
          </div>
      </section>
  `;
  return cardElement;
}


// Add validation functions
function sanitizeText(input) {
  if (!input) return '';
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

function validateImageUrl(url) {
  try {
      new URL(url);
      return url;
  } catch {
      return './images/fallback.jpg';
  }
}

// Download Functions
async function downloadShayari(id) {
  try {
      const shayariBlock = document.getElementById(`shayari-${id}`);
      if (!shayariBlock) {
          throw new Error(`Shayari block with ID ${id} not found`);
      }

      const buttons = shayariBlock.querySelectorAll('.download-btn');
      buttons.forEach(btn => btn.style.display = 'none');

      const canvas = await html2canvas(shayariBlock, {
          useCORS: true,
          scale: 2 // High quality
      });

      // Add watermark
      const ctx = canvas.getContext('2d');
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('priyavats.netlify.app', canvas.width - 150, canvas.height - 30);

      canvas.toBlob(blob => {
          saveAs(blob, `shayari-${id}-${Date.now()}.png`);
          buttons.forEach(btn => btn.style.display = 'block');
      });
  } catch (error) {
      console.error('Download failed:', error);
      alert('Could not generate download. Please try again.');
      document.querySelectorAll(`#shayari-${id} .download-btn`).forEach(btn => btn.style.display = 'block');
  }
}

function downloadShayariOnBackground(id) {
  const shayariBlock = document.getElementById(`shayari-${id}`);
  const buttons = shayariBlock.querySelectorAll('.download-btn');
  const shayariText = shayariBlock.querySelector('.shayari-content p').innerHTML.replace();
  const backgroundPath = 'images/bg/bg1.jpg';

  buttons.forEach(btn => btn.style.display = 'none');

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const bgImage = new Image();

  bgImage.onload = function () {
      canvas.width = bgImage.width;
      canvas.height = bgImage.height;

      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

      // Set text properties
      ctx.font = '20px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lines = shayariText.split('\n').map(line => line.trim());
      const lineHeight = 20;
      const textHeight = lines.length * lineHeight;
      let y = (canvas.height - textHeight) / 2 + lineHeight / 2;

      lines.forEach(line => {
          ctx.fillText(line, canvas.width / 2, y);
          y += lineHeight;
      });

      // Add watermark
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
      ctx.textAlign = 'right';
      ctx.fillText('priyavats.netlify.app', canvas.width - 10, canvas.height - 30);

      canvas.toBlob(function (blob) {
          saveAs(blob, `${id}-solid-background.png`);
          buttons.forEach(btn => btn.style.display = 'block');
      });
  };

  bgImage.src = backgroundPath;

  bgImage.onerror = function () {
      console.error('Error loading background image');
      buttons.forEach(btn => btn.style.display = 'block');
  };
}

// Dark Mode Toggle
document.getElementById('dark-mode-toggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

// Service Worker Registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
          .then(registration => {
              console.log('ServiceWorker registration successful');
          }).catch(err => {
              console.log('ServiceWorker registration failed:', err);
          });
  }
}

// Error Handling
function displayError(errorMessage) {
  const errorAlert = document.createElement('div');
  errorAlert.className = 'alert alert-danger mt-3';
  errorAlert.textContent = errorMessage;
  shayariContainer.parentNode.insertBefore(errorAlert, loadMoreButton);
}
