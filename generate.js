const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));

data.forEach(item => {
  const html = `
  <!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${item.name}</title>

    <!-- JSON-LD Schema.org -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "${item.name}",
      "image": "${item.image}",
      "description": "${item.description}",
      "url": "https://username.github.io/naver-schema-test/detail-${item.id}.html",
      "jobTitle": "${item.jobTitle}",
      "worksFor": {
        "@type": "Organization",
        "name": "${item.org}"
      }
    }
    </script>
  </head>
  <body>
    <h1>${item.name}</h1>
    <img src="${item.image}" alt="${item.name}" width="200"/>
    <p>${item.description}</p>
    <p>직함: ${item.jobTitle}</p>
    <p>소속: ${item.org}</p>
    <a href="index.html">← 목록으로</a>
  </body>
  </html>
  `;
  fs.writeFileSync(path.join(__dirname, `detail-${item.id}.html`), html.trim());
});

console.log('✅ 상담사 상세 페이지 생성 완료!');