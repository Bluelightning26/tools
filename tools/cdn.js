// CDN uploader
// beans
// will somehow move to .env for good practices later, don't know how yet
const CDN_AUTH_KEY = "beans";

// valid url?
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// html elements
document.getElementById('cdnBtn').onclick = async function() {

    const userLink = document.getElementById('fileLink').value.trim();
    const errorDiv = document.getElementById('error');
    const successDiv = document.getElementById('success');
    errorDiv.textContent = '';
    successDiv.textContent = '';

    // val input URL
    if (!userLink || !isValidUrl(userLink)) {
        const errorMsg = 'Invalid or empty link provided.';
        errorDiv.textContent = errorMsg;
        console.error(errorMsg);
        return;
    }
    
// the api part
    try {
        const response = await fetch("https://cdn.hackclub.com/api/v3/new", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CDN_AUTH_KEY}`
            },
            body: JSON.stringify([userLink])
        });

        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

       
        const data = await response.json();
        console.log("API response:", data);

        
        // show only deployedUrl field to user
        if (data.files && Array.isArray(data.files) && data.files.length > 0 && data.files[0].deployedUrl)
        {
            const url = data.files[0].deployedUrl;
            
            successDiv.innerHTML =
                'Upload succeeded!<br>CDN URL: <br> <a href="' +
                url + '" target="_blank">' +
                url + '</a> ' +
                `<button id="copyBtn" style="margin-left:8px;">Copy</button>`;

            // copy button
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
    }
};

