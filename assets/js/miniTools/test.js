console.log('Spectrum simple loaded');

document.addEventListener('DOMContentLoaded', function() {
    var fileInput = document.getElementById('spectrumFile');
    
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (file) {
                alert('File selected: ' + file.name);
            }
        });
    }
});