# 📁 Git 브랜치 전략 가이드 (단순 버전)

## 📌 브랜치 구조
```
main                      ← 개발과 배포 모두 진행
sooyeon/feature-*         ← 기능 개발 브랜치 (개발자명/기능명)
sooyeon/bugfix-*          ← 버그 수정 브랜치 (개발자명/문제명)
```

---

## ✅ 작업 순서 예시

### 🔨 1. 기능 개발 (예: 소셜 로그인)

```bash
git checkout main
git pull origin main
git checkout -b sooyeon/feature-social-login
# 작업 진행
git add .
git commit -m "[feat] 소셜 로그인 구현"
git push origin sooyeon/feature-social-login
```

→ GitHub에서 PR 생성 (대상 브랜치: `main`)  
→ 리뷰 후 머지  
→ 브랜치 삭제

---

### 🐞 2. 나중에 에러가 발견되면?

```bash
git checkout main
git pull origin main
git checkout -b sooyeon/bugfix-social-login
# 수정 후 커밋 & 푸시
git commit -m "[fix] 소셜 로그인 오류 수정"
git push origin sooyeon/bugfix-social-login
```

→ 다시 PR 보내고 머지

---

## ✍️ 커밋 메시지 규칙

```
[태그] 작업 내용 요약
```

| 태그      | 의미             | 예시 |
|-----------|------------------|------|
| `[feat]`  | 기능 추가        | `[feat] 소셜 로그인 구현` |
| `[fix]`   | 버그 수정        | `[fix] 로그인 오류 수정` |
| `[refactor]` | 코드 정리     | `[refactor] 로그인 구조 정리` |

---

## 💡 꼭 기억해 주세요!

- 브랜치는 **기능 하나당 하나씩**, 이름은 `이름/브랜치종류-기능명`
- 작업이 끝나면 **PR → 머지 → 브랜치 삭제**
- 모두 `main` 기준으로 작업합니다.
