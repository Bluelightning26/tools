// CDN uploader
// beans
// will somehow move to .env for good practices later along with putting a lot of this unsecure code in a backend
const CDN_AUTH_KEY = "beans";

// only these files allowed
const ALLOWED_FILE_TYPES = [
    'video/',
    'audio/',
    'application/pdf',
    'text/html',
    'text/css',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/x-icon',
    'text/txt'
];




// valid url?
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

let buckyScriptLoading = false;

async function getLinkFromBucky(file) {
    return new Promise((resolve, reject) => {

        if (window.buckyUpload) {
            window.buckyUpload(file).then(resolve).catch(reject);
            return;
        }

        if (buckyScriptLoading) {
            // wait for script
            const check = setInterval(() => {
                if (window.buckyUpload) {
                    clearInterval(check);
                    window.buckyUpload(file).then(resolve).catch(reject);
                }
            }, 50);
            return;
        }

        buckyScriptLoading = true;
        const script = document.createElement('script');
        script.src = 'bucky.js';

        script.onload = () => {
            buckyScriptLoading = false;
            window.buckyUpload(file).then(resolve).catch(reject);
        };

        script.onerror = () => {
            buckyScriptLoading = false;
            reject(new Error('Failed to load bucky.js'));
        };

        document.body.appendChild(script);
    });
}




// html elements
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

    // val input url
    if (!file) {
        if (!userLink || !isValidUrl(userLink)) {
            errorDiv.textContent = 'Please provide a valid link or select a file.';
            btn.disabled = false;
            return;
        }
    }

    let linkToUse = userLink;
    if (file) {
        // Check file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            errorDiv.textContent = 'File type not allowed. Allowed types: ' + ALLOWED_FILE_TYPES.join(', ');
            btn.disabled = false;
            return;
        }
        try {
            // If a file is uploaded, get a temporary link from bucky.js
            linkToUse = await getLinkFromBucky(file);
            if (!isValidUrl(linkToUse)) {
                throw new Error('bucky.js did not return a valid URL');
            }
        } catch (e) {
            errorDiv.textContent = 'Error processing file: ' + e.message;
            btn.disabled = false;
            return;
        }
    }


    
    
    
    
    // the api part
    try {
        // Always send a link (either user-provided or from bucky.js) to the CDN API
        const response = await fetch("https://cdn.hackclub.com/api/v3/new", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CDN_AUTH_KEY}`
            },
            body: JSON.stringify([linkToUse])
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API response:", data);

        if (data.files && Array.isArray(data.files) && data.files.length > 0 && data.files[0].deployedUrl) {
            const url = data.files[0].deployedUrl;
            successDiv.innerHTML =
                'Upload succeeded!<br>CDN URL: <br> <a href="' +
                url + '" target="_blank">' +
                url + '</a> ' +
                `<button id="copyBtn" style="margin-left:8px;">Copy</button>`;

document.getElementById('copyBtn').onclick = function() {
    navigator.clipboard.writeText(url).then(() => {
        this.textContent = 'Copied!';
        setTimeout(() => { this.textContent = 'Copy'; }, 1200);
    });
};
} else {
    successDiv.textContent = 'Upload succeeded, but no CDN URL returned.';
}

} catch (error) {
    const errorMsg = 'Error posting link: ' + error.message;
    errorDiv.textContent = errorMsg;
    console.error(errorMsg);
} finally {
    btn.disabled = false;
}
};
