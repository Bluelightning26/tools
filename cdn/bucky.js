window.buckyUpload = async function(file) {
    const formData = new FormData();
    formData.append('file', file);

    // Use a public CORS proxy
    const buckyUrl = 'https://bucky.hackclub.com';

    const response = await fetch(buckyUrl, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) throw new Error(`Bucky upload failed: ${response.status}`);

    const result = await response.text();
    // return url as text
    try {
        new URL(result);
        return result;
    } catch {
        throw new Error('No valid URL returned from Bucky');
    }
};