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
            // Upload file to Bucky first
            const formData = new FormData();
            formData.append('file', file);

            const buckyResponse = await fetch('https://bucky.hackclub.com/', {
                method: 'POST',
                body: formData
            });

            if (!buckyResponse.ok) {
                throw new Error('Failed to upload file to Bucky');
            }

            const buckyText = await buckyResponse.text();
            urlToUpload = buckyText.trim();
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
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.files?.[0]?.deployedUrl) {
            const url = data.files[0].deployedUrl;
            successDiv.innerHTML = `Upload succeeded!<br>CDN URL: <br><a href="${url}" target="_blank">${url}</a> <button id="copyBtn">Copy</button>`;

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
    } finally {
        btn.disabled = false;
    }
};