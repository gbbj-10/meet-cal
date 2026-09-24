# -*- coding: utf-8 -*-
"""링크 전수 검사 — 올리기 전에, 그리고 액션 안에서 한 번 더 돌린다.

  python3 link_check.py            내 PC 의 배포본(content/deploy + content/love)을 본다
  python3 link_check.py --root .   이미 펼쳐진 사이트 폴더를 그대로 본다 (깃허브 액션용)

판정 두 줄:
  1) 깨진 링크 0   — 모든 내부 href 가 실제 파일로 떨어지는가
  2) 막다른 길 0   — 모든 페이지에서 주요 구역 전부에 도달할 수 있는가

2026-09-20 에 만들었다. 이걸 안 돌리던 시절, 글 목록 페이지는 사이트 바깥으로
나가는 링크가 0개인 채로 몇 주를 서 있었다. 눈으로 훑으면 "링크가 있네" 에서
멈추고, 그 링크가 같은 섹션 안에서만 돈다는 걸 못 본다.
"""
import os, re, sys, shutil, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.dirname(HERE)
DEPLOY = os.path.join(CONTENT, 'deploy')
LOVE = os.path.join(CONTENT, 'love')          # 빌드가 만들지 않는 정적 페이지
HUB = {'/', '/iljin/', '/map/', '/hunt/', '/ohaeng/'}   # 어디서든 갈 수 있어야 하는 곳


def site_root():
    """--root 로 받은 폴더. 액션에서는 배포가 끝난 저장소 루트를 그대로 넘긴다."""
    if '--root' in sys.argv:
        return os.path.abspath(sys.argv[sys.argv.index('--root') + 1]), False
    return stage(), True


def stage():
    """배포본 + 정적 페이지를 실제 사이트와 같은 모양으로 임시 폴더에 편다."""
    root = tempfile.mkdtemp(prefix='linkcheck-')
    shutil.copy(os.path.join(DEPLOY, 'index.html'), root)
    for d in ('ohaeng', 'map', 'iljin', 'hunt', 'gunghap'):
        src = os.path.join(DEPLOY, d)
        if os.path.isdir(src):
            shutil.copytree(src, os.path.join(root, d))
    # 루트에 그냥 놓여 있는 자산(apple-touch-icon.png 등)
    static = os.path.join(CONTENT, 'static')
    if os.path.isdir(static):
        for f in os.listdir(static):
            src = os.path.join(static, f)
            if os.path.isdir(src):
                shutil.copytree(src, os.path.join(root, f))
            else:
                shutil.copy(src, root)
    # love/ 는 빌드가 만들지 않는 정적 페이지다. 내 PC 에서는 content/love/ 에,
    # 저장소에서는 루트의 love/ 에 있다. 둘 다 본다.
    for cand in (LOVE, os.path.join(os.path.dirname(CONTENT), 'love')):
        f = os.path.join(cand, 'index.html')
        if os.path.isfile(f):
            os.makedirs(os.path.join(root, 'love'), exist_ok=True)
            shutil.copy(f, os.path.join(root, 'love'))
            break
    return root


def page_url(path, root):
    u = '/' + os.path.relpath(path, root).replace(os.sep, '/')
    return u[:-len('index.html')] if u.endswith('/index.html') else u


def resolve(href, cur):
    if re.match(r'^(https?:|mailto:|tel:|#|javascript:|data:)', href):
        return None
    if "'+" in href or '{' in href:      # JS 가 조립하는 주소는 정적 검사 대상이 아니다
        return None
    href = href.split('#')[0].split('?')[0]
    if not href:
        return None
    u = href if href.startswith('/') else os.path.normpath(
        os.path.join(os.path.dirname(cur), href))
    return u if u.startswith('/') else '/' + u


def to_file(u, root):
    p = os.path.join(root, u.lstrip('/'))
    return os.path.join(p, 'index.html') if (u.endswith('/') or os.path.isdir(p)) else p


# 검색엔진 소유 확인 파일. 구글·네이버가 시키는 대로 올려 둔 한 줄짜리
# 껍데기라 나가는 링크가 없는 게 정상이다. 사람이 보는 페이지가 아니다.
VERIFY = ('google', 'naver', 'baidu', 'yandex', 'bingsiteauth', 'pinterest')


def is_page(f):
    """사람이 보는 페이지인가. 소유 확인 파일과 빈 껍데기는 검사 대상이 아니다."""
    n = os.path.basename(f).lower()
    if n.startswith(VERIFY):
        return False
    return os.path.getsize(f) >= 1024


def walk_html(root):
    """`_content`, `.github` 처럼 배포되지 않는 폴더는 건너뛴다."""
    out = []
    for d, dirs, fs in os.walk(root):
        dirs[:] = [x for x in dirs if not x.startswith(('_', '.'))]
        out += [os.path.join(d, f) for f in fs
                if f.endswith('.html') and is_page(os.path.join(d, f))]
    return sorted(out)


def main():
    root, temp = site_root()
    try:
        pages = walk_html(root)
        if not pages:
            print('::error::검사할 HTML 이 없습니다 — %s' % root)
            return 1
        broken, dead, rows = [], [], []
        for f in pages:
            cur = page_url(f, root)
            html = open(f, encoding='utf-8').read()
            outs = set()
            for h in re.findall(r'href="([^"]+)"', html):
                u = resolve(h, cur)
                if u is None:
                    continue
                outs.add(u)
                if not os.path.exists(to_file(u, root)):
                    broken.append((cur, h))
            reach = {h for h in HUB
                     if h in outs or (h == '/ohaeng/' and cur.startswith('/ohaeng/'))}
            missing = sorted(HUB - reach - {cur})
            rows.append((cur, len(outs), missing))
            if missing:
                dead.append(cur)

        w = max(len(r[0]) for r in rows)
        print('%-*s  %s  %s' % (w, '페이지', '나가는곳', '못 가는 구역'))
        for u, c, m in rows:
            print('%-*s  %6d  %s' % (w, u, c, ' '.join(m) if m else 'OK'))
        print()
        print('깨진 링크 %d 개' % len(broken))
        for c, h in broken:
            print('::error::깨진 링크 — %s 에서 %s' % (c, h))
        print('막다른 길 %d 개' % len(dead))
        for c in dead:
            print('::error::막다른 길 — %s 에서 못 가는 곳이 있습니다' % c)
        return 1 if (broken or dead) else 0
    finally:
        if temp:
            shutil.rmtree(root, ignore_errors=True)


if __name__ == '__main__':
    sys.exit(main())
