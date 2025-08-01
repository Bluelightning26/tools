const CDN_AUTH_KEY = "beans";

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Drag and drop functionality
const fileDropArea = document.getElementById('fileDropArea');
const fileInput = document.getElementById('fileUpload');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileDropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    fileDropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    fileDropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    fileDropArea.classList.add('dragover');
}

function unhighlight(e) {
    fileDropArea.classList.remove('dragover');
}

fileDropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        fileInput.files = files;
        updateFileDisplay();
    }
}

// Update file display when file is selected
fileInput.addEventListener('change', updateFileDisplay);

function updateFileDisplay() {
    const file = fileInput.files[0];
    const uploadText = document.querySelector('.upload-text');

    if (file) {
        uploadText.innerHTML = `
            Selected: ${file.name}<br>
            <small>Click to change or drag a new file</small>
        `;
    } else {
        uploadText.innerHTML = `
            Click to select a file<br>
            <small>or drag and drop here</small>
        `;
    }
}

document.getElementById('cdnBtn').onclick = async function() {
    const userLink = document.getElementById('fileLink').value.trim();
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];
    const errorDiv = document.getElementById('error');
    const successDiv = document.getElementById('success');
    const progressBar = document.getElementById('progress');
    const btn = document.getElementById('cdnBtn');

    // Clear previous messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    errorDiv.textContent = '';
    successDiv.textContent = '';

    btn.disabled = true;
    progressBar.style.display = 'block';

    try {
        let urlToUpload;

        if (file) {
            // Upload file through your server proxy
            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const uploadData = await uploadResponse.json();
            urlToUpload = uploadData.url;

            if (!urlToUpload || !isValidUrl(urlToUpload)) {
                throw new Error('Invalid URL returned from upload');
            }
        } else if (userLink && isValidUrl(userLink)) {
            urlToUpload = userLink;
        } else {
            throw new Error('Please provide a valid URL or select a file.');
        }

        const response = await fetch("https://cdn.hackclub.com/api/v3/new", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CDN_AUTH_KEY}`
            },
            body: JSON.stringify([urlToUpload])
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`CDN upload failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (data.files?.[0]?.deployedUrl) {
            const url = data.files[0].deployedUrl;
            successDiv.innerHTML = `Upload succeeded!<br><div class="link-box">CDN URL:<br><a href="${url}" target="_blank">${url}</a></div><button id="copyBtn">Copy</button>`;
            successDiv.style.display = 'block';

            document.getElementById('copyBtn').onclick = function() {
                navigator.clipboard.writeText(url).then(() => {
                    this.textContent = 'Copied!';
                    setTimeout(() => this.textContent = 'Copy', 1200);
                });
            };
        } else {
            successDiv.textContent = 'Upload succeeded, but no CDN URL returned.';
            successDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Error: ' + error.message;
        errorDiv.style.display = 'block';
        console.error('Upload error:', error);
    } finally {
        btn.disabled = false;
        progressBar.style.display = 'none';
    }
};