
// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCbVIi_4FcUJ5qDNownlzxy2jQR0Z9YuDA",
  authDomain: "absen-277bf.firebaseapp.com",
  projectId: "absen-277bf",
  storageBucket: "absen-277bf.firebasestorage.app",
  messagingSenderId: "209791477393",
  appId: "1:209791477393:web:40ea2495646c5510694130"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let qrFiles = [];

async function upload() {
  const file = document.getElementById('csvFile').files[0];
  if (!file) return alert('Pilih file CSV dulu bre!');

  Papa.parse(file, {
    header: true,
    complete: async function(results) {
      const siswaList = results.data;
      const tableBody = document.querySelector('#dataTable tbody');
      tableBody.innerHTML = '';
      const progress = document.getElementById('progressBar').firstElementChild;
      progress.style.width = '0%';

      for (let i = 0; i < siswaList.length; i++) {
        const siswa = siswaList[i];
        let status = '✅';

        try {
          // Upload ke Firestore
          await db.collection('siswa').doc(siswa.id).set({
            id: siswa.id,
            nama: siswa.nama,
            kelas: siswa.kelas
          });

          // Generate QR
          const wrapper = document.createElement('div');
          wrapper.style.display = 'flex';
          wrapper.style.flexDirection = 'column';
          wrapper.style.alignItems = 'center';
          wrapper.style.margin = '10px';

          const canvas = document.createElement('canvas');
          await QRCode.toCanvas(canvas, siswa.id);
          
          const label = document.createElement('span');
          label.textContent = siswa.nama;
          label.style.marginTop = '8px';
          label.style.fontSize = '14px';
          label.style.color = 'white';
          label.style.fontWeight = 'regular';

          wrapper.appendChild(canvas);
          wrapper.appendChild(label);
          
          document.getElementById('qrContainer').appendChild(wrapper);

          const blob = await new Promise(resolve => canvas.toBlob(resolve));
          qrFiles.push({ name: `${siswa.nama}_${siswa.id}.png`, blob });

        } catch (err) {
          console.error(`❌ Gagal upload ${siswa.nama}`, err);
          status = '❌';
        }

        // Update tabel
        const row = document.createElement('tr');
        row.innerHTML = `<td>${siswa.id}</td><td>${siswa.nama}</td><td>${siswa.kelas}</td><td>${status}</td>`;
        tableBody.appendChild(row);

        // Update progress
        progress.style.width = `${((i + 1) / siswaList.length) * 100}%`;
      }
    }
  });
}

async function downloadAllQR() {
  const zip = new JSZip();
  qrFiles.forEach(file => {
    zip.file(file.name, file.blob);
  });

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "semua_qr.zip");
}
