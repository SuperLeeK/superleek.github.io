import fs from "fs";
import path from "path";
import axios from "axios";
import { createHTTP2Adapter } from "axios-http2-adapter";

enum CounselingCategory {
  Saju = "Saju",
  Tarot = "Tarot",
  Sinjum = "Sinjum",
}

axios.defaults.adapter = createHTTP2Adapter({ force: true });

const safeParseInt = (value: string | number, defaultValue: number = 0) => {
  return isNaN(+value) ? defaultValue : parseInt(value as string, 10);
};

interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

interface Pagination<T> {
  data: T[];
  items?: T[];
  meta: PaginationMeta;
}

interface ICounselorInfo {
  id: number;
  nickname: string;
  introduction: string;
  counselingCategory: CounselingCategory;
  typeD: { uri: string } | null;
  rate: number;
  reviewCount: number;
  favoriteCount: number;
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

export interface IReview {
  id: number;
  title: string;
  content: string;
  rate: number;
}

const [argPage, argSize] = [...process.argv].reverse();
const page = safeParseInt(argPage, 1);
const size = safeParseInt(argSize, 300);

const CounselingCategoryLabel = {
  [CounselingCategory.Saju]: "사주",
  [CounselingCategory.Tarot]: "타로",
  [CounselingCategory.Sinjum]: "신점",
};

async function fetchCounselorReview(counselorId: number) {
  try {
    const response = await axios.get<Pagination<IReview>>(`https://api.mazzum.kr:3010/review`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        responseType: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      params: {
        page: 1,
        size: 3,
        counselorId,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error(error);
  }
}

async function fetchCounselors() {
  try {
    // counselorIds.json에서 상담사 번호 목록 읽기
    const counselorIds = JSON.parse(fs.readFileSync("./counselorIds.json", "utf-8"));

    const response = await axios.get<Pagination<ICounselorInfo>>(
      `https://api.mazzum.kr:3010/counselor`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          responseType: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
        params: {
          page,
          size,
          seo: true,
          ids: counselorIds?.join(","),
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error(error);
  }
}

const convertToHtml = async (counselor: ICounselorInfo) => {
  const reviews = await fetchCounselorReview(counselor.id);
  const html = `
  <!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${counselor.seo.title}</title>
    <link rel="canonical" href="https://superleek.github.io/detail-${counselor.id}.html" />
    <meta name="og:description" content="${counselor.seo.description}" />
    <meta property="og:image" content="${counselor.typeD?.uri}" />
    <meta property="og:image:alt" content="${counselor.nickname}" />
    <!-- JSON-LD Schema.org -->
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "${counselor.nickname}",
        "image": "${counselor.typeD?.uri}",
        "description": "${counselor.seo.description}",
        "url": "https://superleek.github.io/detail-${counselor.id}.html",
        "jobTitle": "${CounselingCategoryLabel[counselor.counselingCategory]}",
        "worksFor": {
          "@type": "Organization",
          "name": "맞점"
        }
      }
    </script>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "${counselor.rate.toFixed(2)}",
          "bestRating": "5",
          "reviewCount": "${counselor.reviewCount}",
          "ratingCount": "${counselor.favoriteCount}"
        }
      }
    </script>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "item": {
              "@id": "https://superleek.github.io/counselor-list.html",
              "name": "상담사목록"
            }
          },
          {
            "@type": "ListItem",
            "position": 2,
            "item": {
              "@id": "https://superleek.github.io/detail-${counselor.id}.html",
              "name": "${counselor.nickname}"
            }
          }
        ]
      }
    </script>
    <script type="application/ld+json">
      {
        "@context": "http://schema.org",
        "@type": "FAQPage",
        "mainEntity": [${reviews?.map(review => {
          return `
          {
            "@type": "Question",
            "name": "${review.title}",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "${review.content}"
            }
          }
          `;
        })}]
      }
    </script>

    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "review": [${reviews?.map(review => {
          return `
          {
            "@type": "Review",
            "reviewBody": "${review.content}",
            "reviewRating": {
              "@type": "Rating",
              "bestRating": "5",
              "ratingValue": "${review.rate}"
            }
          },
          `;
        })}]
      }
    </script>
  </head>
  <body>
    <h1>${counselor.nickname}</h1>
    <img
      src="${counselor.typeD?.uri}"
      alt="${counselor.nickname}"
      width="400"
    />
    <h4>${counselor.introduction}</h4>
    <p>상담타입: ${CounselingCategoryLabel[counselor.counselingCategory]}</p>
    <a href="counselor-list.html">← 목록으로</a>
  </body>
</html>
  `;

  fs.writeFileSync(path.join(`./detail-${counselor.id}.html`), html.trim());
};

const generateCounselorListPage = (counselors: ICounselorInfo[]) => {
  // 상담타입별 분류
  const groupedByCategory = counselors.reduce(
    (acc, counselor) => {
      const category = CounselingCategoryLabel[counselor.counselingCategory];
      if (!acc[category]) acc[category] = [];
      acc[category].push(counselor);
      return acc;
    },
    {} as Record<string, ICounselorInfo[]>
  );

  // 이름순 정렬
  const sortedByName = [...counselors].sort((a, b) => a.nickname.localeCompare(b.nickname));

  const html = `
  <!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>상담사 목록</title>
    <link rel="canonical" href="https://superleek.github.io/counselor-list.html" />
    <meta name="description" content="상담사 목록" />
    <meta name="og:description" content="상담사 목록" />
    <meta name="og:title" content="상담사 목록" />
    <meta name="og:type" content="website" />
    <meta name="og:url" content="https://superleek.github.io/counselor-list.html" />
    <meta name="og:image" content="/images/open-graph.png" />
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [${counselors
          .map(
            (counselor, index) => `
          {
            "@type": "ListItem",
            "position": ${index + 1},
            "item": {
              "@type": "Person",
              "name": "${counselor.nickname}",
              "image": "${counselor.typeD?.uri}",
              "description": "${counselor.seo.description}",
              "url": "https://superleek.github.io/detail-${counselor.id}.html",
              "jobTitle": "${CounselingCategoryLabel[counselor.counselingCategory]}",
              "worksFor": {
                "@type": "Organization",
                "name": "맞점"
              }
            }
          }`
          )
          .join(",")}]
      }
    </script>
  </head>

  <body>
    <h1>상담사 목록</h1>
    <ul>
      ${counselors.map(counselor => `<li><a href="detail-${counselor.id}.html">${counselor.nickname}</a></li>`).join("\n      ")}
    </ul>
    
    <h2>상담타입</h2>
    ${Object.entries(groupedByCategory)
      .map(
        ([category, counselorList]) => `
    <h3>${category}</h3>
    <ul>
      ${counselorList.map(counselor => `<li><a href="detail-${counselor.id}.html">${counselor.nickname}</a></li>`).join("\n      ")}
    </ul>`
      )
      .join("\n    ")}
    
    <h2>이름순서</h2>
    <ul>
      ${sortedByName.map(counselor => `<li><a href="detail-${counselor.id}.html">${counselor.nickname}</a></li>`).join("\n      ")}
    </ul>
  </body>
</html>
  `;

  fs.writeFileSync(path.join(`./counselor-list.html`), html.trim());
};

const generateSitemap = (counselors: ICounselorInfo[]) => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 형식

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://superleek.github.io/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://superleek.github.io/counselor-list.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.9</priority>
  </url>
${counselors
  .map(
    counselor => `  <url>
    <loc>https://superleek.github.io/detail-${counselor.id}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>always</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  fs.writeFileSync(path.join(`./sitemap.xml`), xml);
};

const generateBookmarklet = (counselors: ICounselorInfo[]) => {
  const bookmarklet = `
javascript: (function () {
  const values = [
    'https://superleek.github.io',
    'https://superleek.github.io/counselor-list.html',
    ${counselors
      .map(counselor => `'https://superleek.github.io/detail-${counselor.id}.html'`)
      .join(",\n\t\t")}
  ].flat();
  const inputSelector = '#input-209';
  const buttonSelector = '#app > div > main > div > div:nth-child(2) > div:nth-child(2) > div > div.row.mt-5.pb-12.justify-space-between > div.pb-0.col-md-9.col-12 > div.container.pa-0.white > div.row.api_box.px-6.pt-8.pb-4.no-gutters > div.container.pa-0 > div > div:nth-child(1) > div.mt-3.col.col-12 > div > div.row.d-flex-wrap.no-gutters.align-center > div.pl-6.col.col-auto > button';

  async function processValue(value, index) {
    const input = document.querySelector(inputSelector);
    if (input) {
      input.focus();
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const button = document.querySelector(buttonSelector);
    if (button) {
      button.click();
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async function processAll() {
    console.log('Starting batch processing...');

    for (let i = 0; i < values.length; i++) {
      await processValue(values[i], i);
    }

    console.log('All processing completed! bye');
  }

  processAll();
})();
`;
  fs.writeFileSync(path.join(`./bookmarklet.js`), bookmarklet);
};

async function main() {
  const counselors = await fetchCounselors();
  if (!counselors?.length) return console.error("상담사 목록 조회 실패");

  // 상담사 상세 페이지 생성
  counselors.forEach(counselor => {
    convertToHtml(counselor);
  });

  // 상담사 목록 페이지 생성
  generateCounselorListPage(counselors);

  // 사이트맵 생성
  generateSitemap(counselors);

  // 북마클릿 생성
  generateBookmarklet(counselors);
}

main()
  .catch(console.error)
  .finally(() => {
console.log("✅ 상담사 상세 페이지 생성 완료!");
  });
