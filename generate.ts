import fs from "fs";
import path from "path";
import axios from "axios";
import { CounselingCategory } from "./enums/index";

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
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

const [argPage, argSize] = [...process.argv].reverse();
const page = safeParseInt(argPage, 1);
const size = safeParseInt(argSize, 300);

async function fetchCounselors() {
  try {
    const response = await axios.get<Pagination<ICounselorInfo>>(
      "https://api.mazzum.kr:3010/counselor",
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
          ids: [178, 415, 244, 488, 382]?.join(","),
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error(error);
  }
}

console.log('ho');

async function main() {
  const counselors = await fetchCounselors();
  console.log('counselors:', counselors);
}

main().catch(console.error);

// const data = JSON.parse(fs.readFileSync("./data.json", "utf-8"));

// data.forEach(item => {
//   const html = `
//   <!DOCTYPE html>
//   <html lang="ko">
//   <head>
//     <meta charset="UTF-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//     <title>${item.name}</title>

//     <!-- JSON-LD Schema.org -->
//     <script type="application/ld+json">
//     {
//       "@context": "https://schema.org",
//       "@type": "Person",
//       "name": "${item.name}",
//       "image": "${item.image}",
//       "description": "${item.description}",
//       "url": "https://username.github.io/naver-schema-test/detail-${item.id}.html",
//       "jobTitle": "${item.jobTitle}",
//       "worksFor": {
//         "@type": "Organization",
//         "name": "${item.org}"
//       }
//     }
//     </script>
//   </head>
//   <body>
//     <h1>${item.name}</h1>
//     <img src="${item.image}" alt="${item.name}" width="200"/>
//     <p>${item.description}</p>
//     <p>직함: ${item.jobTitle}</p>
//     <p>소속: ${item.org}</p>
//     <a href="index.html">← 목록으로</a>
//   </body>
//   </html>
//   `;
//   fs.writeFileSync(path.join(__dirname, `detail-${item.id}.html`), html.trim());
// });

console.log("✅ 상담사 상세 페이지 생성 완료!");
