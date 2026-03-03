document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('guestbook-form');
    const mailingList = document.getElementById('mailing-list');
    const formatGroup = document.getElementById('format-group');
    const meetDropdown = document.getElementById('meet');
    const otherGroup = document.getElementById('other-specify-group');

    mailingList.addEventListener('change', () => {
        formatGroup.style.display = mailingList.checked ? 'block' : 'none';
    });

    meetDropdown.addEventListener('change', () => {
        otherGroup.style.display = meetDropdown.value === 'other' ? 'block' : 'none';
    });

    form.addEventListener('submit', (e) => {
        let isValid = true;

        document.querySelectorAll('.err-msg').forEach(el => el.textContent = '');

        const fname = document.getElementById('first-name').value.trim();
        const lname = document.getElementById('last-name').value.trim();
        if (!fname) {
            document.getElementById('err-fname').textContent = "First name is required";
            isValid = false;
        }
        if (!lname) {
            document.getElementById('err-lname').textContent = "Last name is required";
            isValid = false;
        }

        const email = document.getElementById('email').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (mailingList.checked && !email) {
            document.getElementById('err-email').textContent = "Email required for mailing list";
            isValid = false;
        } else if (email && !emailRegex.test(email)) {
            document.getElementById('err-email').textContent = "Must contain @ and a dot (.)";
            isValid = false;
        }

        const linkedin = document.getElementById('linkedin').value.trim();
        if (linkedin && !linkedin.startsWith("https://linkedin.com/in/")) {
            document.getElementById('err-linkedin').textContent = "Must start with https://linkedin.com/in/";
            isValid = false;
        }

        if (meetDropdown.value === "") {
            document.getElementById('err-meet').textContent = "Selection required";
            isValid = false;
        }

        if (!isValid) {
            e.preventDefault();
        }
    });
});