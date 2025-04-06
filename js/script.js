const firebaseConfig = {
    apiKey: "AIzaSyDDvMT4xqAEauAeEt0Fq4y-it2Mvwzng60",
  authDomain: "vishesh-314e3.firebaseapp.com",
  projectId: "vishesh-314e3",
  storageBucket: "vishesh-314e3.firebasestorage.app",
  messagingSenderId: "144407725016",
  appId: "1:144407725016:web:d9e067644487b6c9caa8ad",
  
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // App Configuration
  const PAGE_SIZE = 10;
  let lastVisible = null;
  let isFetching = false;
  let hasMore = true;

  // DOM Elements
  const contentContainer = document.getElementById('content');
  const loadMoreBtn = document.getElementById('load-more-btn');

  // Load Initial Content
  document.addEventListener('DOMContentLoaded', () => {
      loadShayari(true);
      initializeServiceWorker();
  });

  // Load More Handler
  loadMoreBtn.addEventListener('click', () => loadShayari(false));

  async function loadShayari(initialLoad = true) {
      if (isFetching || !hasMore) return;
      isFetching = true;
      loadMoreBtn.disabled = true;

      try {
          let query = db.collection("shayri")
              .orderBy("createdAt", "desc")
              .limit(PAGE_SIZE);

          if (!initialLoad && lastVisible) {
              query = query.startAfter(lastVisible);
          }

          const snapshot = await query.get();
          
          if (snapshot.empty) {
              hasMore = false;
              loadMoreBtn.hidden = true;
              return;
          }

          if (initialLoad) contentContainer.innerHTML = '';
          lastVisible = snapshot.docs[snapshot.docs.length - 1];

          snapshot.forEach(doc => {
              const data = doc.data();
              contentContainer.appendChild(createShayriCard(data));
          });

      } catch (error) {
          console.error("Error loading shayri:", error);
          showError("Failed to load content. Please try again.");
      } finally {
          isFetching = false;
          loadMoreBtn.disabled = false;
      }
  }

  // Updated createShayriCard function with validation
function createShayriCard(data) {
const card = document.createElement('div');
card.className = 'col-md-8 mb-4';

// Validate and sanitize data
const safeData = {
  id: data.id || 'unknown-id',
  title: sanitizeText(data.title) || 'Untitled Shayari',
  content: sanitizeText(data.shayri || data.content) || 'Content not available', // Handle both field names
  imageUrl: validateImageUrl(data.imageUrl)
};

card.innerHTML = `
  <section class="shayari" id="shayari-${safeData.id}">
      <h2>${safeData.title}</h2>
      <div class="shayari-content">
         <p>${data.shayri}</p>
      </div>
      <img src="./images/${data.imageUrl}" alt="${data.title}" loading="lazy">
      <div class="button-group">
          <button class="download-btn" onclick="downloadShayari('${safeData.id}')">
              🖼️ With Background
          </button>
          <button class="download-btn" onclick="downloadShayariOnBackground('${safeData.id}')">
              📥 Download 
          </button>
      </div>
  </section>
`;
return card;
}

// Add validation functions
function sanitizeText(text) {
if (!text) return '';
const div = document.createElement('div');
div.textContent = text;
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

  // Download Functions (Same as previous enhanced version)
  async function downloadShayari(id) {
try {
  const shayariElement = document.getElementById(`shayari-${id}`);
  if (!shayariElement) {
      throw new Error(`Shayari element with ID ${id} not found`);
  }

  const downloadButtons = shayariElement.querySelectorAll('.download-btn');
  downloadButtons.forEach(btn => btn.style.display = 'none');

  const canvas = await html2canvas(shayariElement, { 
      useCORS: true,
      scale: 2 // Better image quality
  });

  // Add watermark
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('priyavats.netlify.app', canvas.width - 150, canvas.height - 30);

  canvas.toBlob(blob => {
      saveAs(blob, `shayari-${id}-${Date.now()}.png`);
      downloadButtons.forEach(btn => btn.style.display = 'block');
  });
} catch (error) {
  console.error('Download failed:', error);
  alert('Could not generate download. Please try again.');
  // Re-show buttons if they exist
  const buttons = document.querySelectorAll(`#shayari-${id} .download-btn`);
  buttons.forEach(btn => btn.style.display = 'block');
}
}

function downloadShayariOnBackground(id) {
    const shayariElement = document.getElementById(`shayari-${id}`);
    
    if (!shayariElement) {
        console.error(`Shayari element with ID shayari-${id} not found`);
        return alert('Shayari not found for download.');
    }

    const downloadButtons = shayariElement.querySelectorAll('.download-btn');
    const shayariTextElement = shayariElement.querySelector('.shayari-content p');

    if (!shayariTextElement) {
        console.error('Shayari content not found.');
        return alert('Shayari content is missing.');
    }

    const shayariText = shayariTextElement.innerHTML.replace(/<br>/g, '\n');
    const backgroundImageUrl = 'images/bg/bg1.jpg'; // Path to background image

    // Hide the download buttons
    downloadButtons.forEach(button => button.style.display = 'none');

    // Create a new canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const backgroundImage = new Image();

    backgroundImage.onload = function () {
        // Set canvas dimensions to match the background image
        canvas.width = backgroundImage.width;
        canvas.height = backgroundImage.height;

        // Draw the background image on the canvas
        context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        // Set text properties (position and color)
        context.font = '20px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Calculate the y position to center the text vertically
        const lines = shayariText.split('\n').map(line => line.trim());
        const lineHeight = 20;
        const textHeight = lines.length * lineHeight;
        let y = (canvas.height - textHeight) / 2 + lineHeight / 2;

        // Draw the Shayari text on the canvas
        lines.forEach(line => {
            context.fillText(line, canvas.width / 2, y);
            y += lineHeight;
        });

        // Add a watermark
        context.font = 'bold 20px Arial';
        context.fillStyle = 'rgba(255, 255, 255, 1.0)';
        context.textAlign = 'right';
        context.fillText('priyavats.netlify.app', canvas.width - 10, canvas.height - 30);

        // Create a blob and save the image
        canvas.toBlob(function (blob) {
            saveAs(blob, `shayari-${id}-solid-background.png`);

            // Show the download buttons again
            downloadButtons.forEach(button => button.style.display = 'block');
        });
    };

    backgroundImage.src = backgroundImageUrl;

    backgroundImage.onerror = function () {
        console.error('Error loading the background image');

        // Show the download buttons again if there is an error
        downloadButtons.forEach(button => button.style.display = 'block');
    };
}


  // Dark Mode Toggle
  document.getElementById('dark-mode-toggle').addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  });

  // Service Worker Registration
  function initializeServiceWorker() {
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
  function showError(message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'alert alert-danger mt-3';
      errorDiv.textContent = message;
      contentContainer.parentNode.insertBefore(errorDiv, loadMoreBtn);
  }
