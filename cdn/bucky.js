// Simple client-side file to data URL converter
window.buckyUpload = async function(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(e) {
            // Convert to data URL (base64) that can be sent to APIs
            resolve(e.target.result);
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file); // Changed from readAsArrayBuffer to readAsDataURL
    });
};