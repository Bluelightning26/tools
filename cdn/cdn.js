const CDN_AUTH_KEY = "beans";

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

document.getElementById('cdnBtn').onclick = async function() {
    const userLink = document.getElementById('fileLink').value.trim();
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];
    const errorDiv = document.getElementById('error');
    const successDiv = document.getElementById('success');
    const btn = document.getElementById('cdnBtn');

    errorDiv.textContent = '';
    successDiv.textContent = '';
    btn.disabled = true;

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
            errorDiv.textContent = 'Please provide a valid URL or select a file.';
            btn.disabled = false;
            return;
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

            document.getElementById('copyBtn').onclick = function() {
                navigator.clipboard.writeText(url).then(() => {
                    this.textContent = 'Copied!';
                    setTimeout(() => this.textContent = 'Copy', 1200);
                });
            };
        } else {
            successDiv.textContent = 'Upload succeeded, but no CDN URL returned.';
        }
    } catch (error) {
        errorDiv.textContent = 'Error: ' + error.message;
        console.error('Upload error:', error);
    } finally {
        btn.disabled = false;
    }
};