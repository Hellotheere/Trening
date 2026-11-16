/* Muskelpolygoner fra react-body-highlighter.
 * Copyright (c) 2020 GV79
 * MIT License. Se https://github.com/giavinh79/react-body-highlighter
 * Tilpasset til vanlig JavaScript for denne appen.
 */
(() => {
  const ANTERIOR = [
  { muscle: "CHEST", points: ["518 416 510 551 580 580 678 555 706 473 620 416", "298 465 314 555 408 580 482 551 478 420 376 420"] },
  { muscle: "OBLIQUES", points: ["686 633 673 571 588 596 600 641 604 833 657 788 665 698", "339 784 331 718 310 633 322 571 408 592 392 633 392 837"] },
  { muscle: "ABS", points: ["563 592 580 641 584 780 584 927 563 984 551 1041 514 1078 510 845 506 673 510 571", "437 588 486 571 490 673 486 845 482 1073 445 1037 408 914 408 784 412 645"] },
  { muscle: "BICEPS", points: ["167 682 180 714 229 661 290 539 278 494 204 559", "714 494 702 547 763 661 816 718 829 690 788 555"] },
  { muscle: "TRICEPS", points: ["694 555 694 616 759 727 776 702 755 673", "224 694 298 555 298 608 229 731"] },
  { muscle: "NECK", points: ["555 237 506 335 506 392 616 400 706 449 694 367 633 351 584 306", "290 449 302 371 363 351 412 302 445 245 490 339 486 392 380 396"] },
  { muscle: "FRONT_DELTOIDS", points: ["784 531 796 478 792 412 759 380 710 363 722 429 714 473", "282 473 212 531 200 478 204 408 245 371 286 371 269 433"] },
  { muscle: "HEAD", points: ["424 29 400 118 420 196 461 233 498 253 547 224 576 192 592 102 571 24 498 0"] },
  { muscle: "ABDUCTORS", points: ["527 1102 543 1249 600 1102 620 1000 649 943 600 927 567 1045", "478 1106 449 1253 420 1159 404 1131 396 1073 380 1024 347 939 396 922 416 992 437 1053"] },
  { muscle: "QUADRICEPS", points: ["347 988 371 1082 371 1278 343 1371 310 1327 294 1200 282 1114 294 1008 322 947", "633 1057 645 1000 669 947 702 1012 710 1118 682 1331 653 1376 624 1286 620 1114", "388 1294 384 1122 412 1184 445 1294 429 1351 400 1461 363 1465 355 1400", "596 1457 555 1290 608 1139 612 1302 641 1396 629 1465", "327 1384 265 1457 257 1367 257 1273 269 1143 294 1335", "718 1131 739 1241 739 1404 727 1457 665 1384 702 1335"] },
  { muscle: "KNEES", points: ["339 1400 347 1433 355 1473 363 1510 351 1567 298 1567 273 1527 273 1473 302 1441", "657 1400 722 1478 722 1522 698 1571 649 1567 629 1510"] },
  { muscle: "CALVES", points: ["714 1604 735 1535 767 1612 796 1678 784 1878 796 1955 747 1955", "249 1947 278 1649 282 1604 261 1543 249 1576 224 1616 208 1678 220 1882 208 1955", "727 1951 698 1592 653 1584 641 1624 641 1653 657 1771", "355 1584 359 1624 359 1669 351 1722 351 1767 322 1820 306 1873 269 1947 273 1878 282 1804 286 1755 290 1698 298 1641 302 1588"] },
  { muscle: "FOREARM", points: ["61 886 102 751 147 702 163 743 192 735 45 976 0 1000", "845 698 833 735 800 731 951 984 1000 1004 935 894 898 763", "776 722 776 776 804 841 853 898 922 1012 947 996", "69 1012 135 906 188 841 216 771 212 718 49 988"] }
  ];
  const POSTERIOR = [
  { muscle: "HEAD", points: ["506 0 460 9 409 55 404 128 451 200 557 200 591 136 596 47 557 13"] },
  { muscle: "TRAPEZIUS", points: ["447 217 477 217 472 383 477 647 383 532 353 409 311 366 391 332 438 272", "523 217 557 217 566 272 609 328 689 366 647 404 617 532 523 647 532 383"] },
  { muscle: "BACK_DELTOIDS", points: ["294 370 230 391 174 443 183 536 243 494 272 464", "711 370 783 396 826 447 817 536 749 489 723 451"] },
  { muscle: "UPPER_BACK", points: ["311 387 281 489 285 553 340 753 472 711 472 664 366 540 336 413", "689 387 719 494 715 562 660 753 528 711 528 664 634 545 664 417"] },
  { muscle: "TRICEPS", points: ["268 498 179 557 145 723 166 817 217 638 268 557", "736 502 821 557 860 732 834 821 779 630 732 557", "268 583 268 685 230 753 191 774 226 655", "728 583 770 647 804 774 766 753 728 689"] },
  { muscle: "LOWER_BACK", points: ["477 728 345 770 353 834 494 1021 468 830", "523 728 655 770 647 834 506 1021 532 838"] },
  { muscle: "FOREARM", points: ["864 757 911 834 932 940 1000 1064 962 1043 881 894 843 838", "136 757 89 838 68 936 0 1064 38 1043 123 885 157 830", "813 796 774 779 791 847 911 1038 932 1089 945 1047", "187 796 221 779 209 843 94 1030 68 1085 51 1047"] },
  { muscle: "GLUTEAL", points: ["447 996 302 1085 298 1187 315 1260 472 1213 494 1149", "553 991 511 1145 523 1209 681 1260 698 1191 694 1085"] },
  { muscle: "ADDUCTOR", points: ["481 1230 447 1230 413 1255 451 1443 485 1357 489 1294", "519 1226 557 1234 591 1260 549 1443 519 1362 511 1294"] },
  { muscle: "HAMSTRING", points: ["289 1221 311 1294 366 1260 353 1353 345 1502 294 1583 289 1468 277 1413 272 1315", "715 1217 694 1289 638 1260 655 1366 664 1502 711 1583 715 1477 728 1421 736 1319", "387 1255 443 1460 404 1668 362 1528 370 1353", "617 1255 634 1362 643 1532 600 1668 562 1464"] },
  { muscle: "KNEES", points: ["345 1532 311 1591 336 1664 374 1626", "664 1536 630 1630 668 1664 694 1591"] },
  { muscle: "CALVES", points: ["294 1604 285 1672 247 1796 238 1928 255 1970 285 1932 298 1800 319 1711 319 1668", "374 1651 353 1677 332 1719 311 1804 302 1919 340 2000 387 1906 391 1689", "630 1651 613 1685 617 1906 664 1996 706 1919 689 1796 668 1702", "706 1604 723 1685 757 1791 766 1928 745 1966 723 1936 706 1796 681 1681"] },
  { muscle: "LEFT_SOLEUS", points: ["285 1957 302 1957 336 2017 306 2200 285 2136 268 1983"] },
  { muscle: "RIGHT_SOLEUS", points: ["698 1957 719 1957 736 1983 719 2132 702 2196 672 2021"] }
  ];

  const TO_PAINT = {
    CHEST: "pecs",
    FRONT_DELTOIDS: "front_delt",
    BACK_DELTOIDS: "rear_delt",
    BICEPS: "biceps",
    TRICEPS: "triceps",
    FOREARM: "forearm",
    ABS: "abs",
    OBLIQUES: "oblique",
    TRAPEZIUS: "trap",
    UPPER_BACK: "lat",
    QUADRICEPS: "quad",
    HAMSTRING: "ham",
    GLUTEAL: "glute",
    ABDUCTORS: "glute",
    CALVES: "calf",
    LEFT_SOLEUS: "calf",
    RIGHT_SOLEUS: "calf",
  };
  const BASE = { HEAD: 1, NECK: 1, KNEES: 1 };
  const EXTRA_NAME = {
    LOWER_BACK: "Korsrygg",
    ADDUCTOR: "Innerside lår",
    NECK: "Nakke",
    HEAD: "Hode",
    KNEES: "Kne",
  };

  function roleFor(muscle, paint) {
    if (BASE[muscle]) return { role: "base", row: null, id: muscle };
    const id = TO_PAINT[muscle];
    if (!id) return { role: "fresh", row: null, id: muscle };
    const row = (paint || []).find((m) => m.id === id) || null;
    return { role: (row && row.role) || "fresh", row, id };
  }

  let figN = 0;
  function figure(side, paint, onPick) {
    const uid = "rbh" + (++figN);
    const rows = side === "back" ? POSTERIOR : ANTERIOR;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 1000 2220");
    svg.setAttribute("class", "rbh");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", side === "back" ? "Muskler bakfra" : "Muskler forfra");
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <linearGradient id="${uid}-base" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a424c"/><stop offset="1" stop-color="#22272d"/>
      </linearGradient>
      <radialGradient id="${uid}-today" cx="30%" cy="18%" r="82%">
        <stop offset="0" stop-color="#f8ffc9"/><stop offset=".42" stop-color="#e4f56a"/><stop offset="1" stop-color="#b5d428"/>
      </radialGradient>
      <radialGradient id="${uid}-assist" cx="32%" cy="22%" r="84%">
        <stop offset="0" stop-color="#f7fbe2"/><stop offset="1" stop-color="#c9dc96"/>
      </radialGradient>
      <radialGradient id="${uid}-recovering" cx="32%" cy="22%" r="84%">
        <stop offset="0" stop-color="#ffe4cc"/><stop offset="1" stop-color="#e08a46"/>
      </radialGradient>
      <radialGradient id="${uid}-fresh" cx="38%" cy="16%" r="88%">
        <stop offset="0" stop-color="#9098a1"/><stop offset="1" stop-color="#4e565e"/>
      </radialGradient>
      <filter id="${uid}-glow" x="-55%" y="-55%" width="210%" height="210%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="18" result="blur"/>
        <feFlood flood-color="#e7ff7a" flood-opacity=".48" result="color"/>
        <feComposite in="color" in2="blur" operator="in" result="halo"/>
        <feFlood flood-color="#ffffff" flood-opacity=".72" result="white"/>
        <feComposite in="white" in2="SourceAlpha" operator="in" result="clip"/>
        <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="ib"/>
        <feComposite in="clip" in2="ib" operator="out" result="inner"/>
        <feMerge>
          <feMergeNode in="halo"/>
          <feMergeNode in="SourceGraphic"/>
          <feMergeNode in="inner"/>
        </feMerge>
      </filter>`;
    svg.appendChild(defs);
    const gid = (role) => "url(#" + uid + "-" + role + ")";
    const fill = {
      today: gid("today"),
      assist: gid("assist"),
      recovering: gid("recovering"),
      fresh: gid("fresh"),
      base: gid("base"),
    };
    for (const group of rows) {
      const info = roleFor(group.muscle, paint);
      for (const points of group.points) {
        const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        poly.setAttribute("points", points);
        poly.setAttribute("fill", fill[info.role] || fill.fresh);
        poly.setAttribute("stroke", info.role === "today" ? "rgba(255,252,214,.72)" : info.role === "base" ? "none" : "rgba(255,255,255,.16)");
        poly.setAttribute("stroke-width", info.role === "base" ? "0" : "1.6");
        poly.setAttribute("stroke-linejoin", "round");
        if (info.role === "today") poly.setAttribute("filter", "url(#" + uid + "-glow)");
        if (info.role !== "base") {
          poly.setAttribute("data-id", info.id);
          poly.style.cursor = "pointer";
          if (onPick) {
            poly.addEventListener("click", (e) => {
              e.stopPropagation();
              if (info.row) onPick(info.row);
              else onPick({ id: info.id, name: EXTRA_NAME[group.muscle] || group.muscle, role: "fresh", sets: 0, kg: 0, date: "" });
            });
          }
        }
        svg.appendChild(poly);
      }
    }
    return svg;
  }

  globalThis.TrenerAnatomy = { figure };
})();
