import https from 'https';
import fs from 'fs';

// counselorIds.json에서 상담사 ID 목록 읽기
function getCounselorIds() {
  try {
    return JSON.parse(fs.readFileSync('./counselorIds.json', 'utf-8'));
  } catch (error) {
    console.error('counselorIds.json 읽기 오류:', error.message);
    return [];
  }
}

// URL 목록 동적 생성
function generateUrlList() {
  const counselorIds = getCounselorIds();
  const baseUrls = [
    "https://superleek.github.io/",
    "https://superleek.github.io/index.html",
    "https://superleek.github.io/counselor-list.html"
  ];

  // 상담사 상세 페이지 URL 추가
  const detailUrls = counselorIds.map(id => `https://superleek.github.io/detail-${id}.html`);

  return [...baseUrls, ...detailUrls];
}

// IndexNow 설정
const config = {
  host: "superleek.github.io",
  key: "b69d2da5f922b5482dbdb63fd4c5b9aa",
  keyLocation: "https://superleek.github.io/b69d2da5f922b5482dbdb63fd4c5b9aa.txt",
  urlList: generateUrlList()
};

// IndexNow API 엔드포인트들
const endpoints = [
  {
    name: 'Bing',
    hostname: 'api.indexnow.org',
    path: '/indexnow'
  },
  {
    name: 'Naver',
    hostname: 'searchadvisor.naver.com',
    path: '/indexnow'
  }
];

// API 호출 함수
function sendIndexNowRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: endpoint.hostname,
      path: endpoint.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log(`${endpoint.name} 응답: ${res.statusCode} ${res.statusMessage}`);
        if (body) {
          console.log(`응답 내용: ${body}`);
        }
        resolve({ endpoint: endpoint.name, statusCode: res.statusCode, body });
      });
    });

    req.on('error', (error) => {
      console.error(`${endpoint.name} 오류:`, error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 메인 실행 함수
async function submitToIndexNow() {
  console.log('IndexNow API 호출 시작...');
  console.log(`제출할 URL 개수: ${config.urlList.length}`);

  try {
    const promises = endpoints.map(endpoint =>
      sendIndexNowRequest(endpoint, config)
    );

    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ ${endpoints[index].name}: 성공`);
      } else {
        console.log(`❌ ${endpoints[index].name}: 실패 - ${result.reason.message}`);
      }
    });

    console.log('IndexNow 제출 완료!');
  } catch (error) {
    console.error('IndexNow 제출 중 오류:', error);
  }
}

// 스크립트로 직접 실행될 때만 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  submitToIndexNow();
}

export { submitToIndexNow, config };