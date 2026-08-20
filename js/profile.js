import { qs } from './dom.js';
import { showToast } from './toast.js';

export function initProfile() {
  const avatarBtn = qs('#avatarBtn');
  const editProfileBtn = qs('#editProfileBtn');
  const profileInfoList = qs('#profileInfoList');
  const profileEditForm = qs('#profileEditForm');

  if (avatarBtn) {
    avatarBtn.addEventListener('click', () => {
      const target = document.querySelector('.nav-link[data-view="profile"]');
      if (target) target.click();
    });

    avatarBtn.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        avatarBtn.click();
      }
    });
  }

  if (editProfileBtn && profileEditForm && profileInfoList) {
    editProfileBtn.addEventListener('click', () => {
      const opening = !profileEditForm.classList.contains('open');
      profileEditForm.classList.toggle('open', opening);
      profileInfoList.style.display = opening ? 'none' : '';
      editProfileBtn.textContent = opening ? 'Cancel' : 'Edit Profile';
    });

    profileEditForm.addEventListener('submit', (event) => {
      event.preventDefault();
      qs('#pv-name').textContent = qs('#editName').value;
      qs('#pv-email').textContent = qs('#editEmail').value;
      qs('#pv-phone').textContent = qs('#editPhone').value;
      qs('#pv-team').textContent = qs('#editTeam').value;
      profileEditForm.classList.remove('open');
      profileInfoList.style.display = '';
      editProfileBtn.textContent = 'Edit Profile';
      showToast('Profile updated');
    });
  }
}
