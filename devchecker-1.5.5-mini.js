// ==UserScript==
// @name         DevChecker mini
// @namespace    http://tampermonkey.net/
// @version      1.5.5
// @description  Check Developers and testers in vk.com! Editor slmatthew
// @updateURL https://openuserjs.org/meta/matuhak/DevChecker.meta.js
// @copyright 2018, slmatthew (https://vk.com/matkrut)
// @license MIT
// @author       slmatthew
// @match        https://vk.com/*
// @grant        GM_xmlhttpRequest
// @connect      itnull.severecloud.me
// ==/UserScript==

//Чекаем версию
var lastver = 1514124632;//Измените число, если вам лень искать, где чистить кэш
if (localStorage.devUsersVer){
    var ver = JSON.parse(localStorage.devUsersVer);
    if (lastver != ver)
        ClearCache();
    localStorage.devUsersVer = lastver;
} else
    ClearCache();

function ClearCache(){//Чистим кэш
    if (localStorage.devUsersCache2){
        localStorage.removeItem("devUsersCache2");
        localStorage.devUsersVer = lastver;
        console.log('clearCache');
    }
}


function DevUsers() {

    var cache = {}; // Кэш
    var groups = { // Настройки
        "150825328": {
            title: "Special Forces",
            href: "https://vk.com/specialtesters",
            background: "url(https://pp.userapi.com/c637621/v637621394/59591/XWk69t0P1Iw.jpg) center/cover"
        },
        "134304772": {
            title: "Тестер, *",
            href: "https://vk.com/bugtracker?act=reporter&id=*",
            background: "url(https://pp.userapi.com/c639625/v639625391/42408/zj0kpTaIKiI.jpg) center/cover"
        },
        "164546092": {
            title: "/testhub",
            href: "https://vk.com/testhub",
            background: "url(https://pp.userapi.com/c830309/v830309163/d9995/kNy6wtUg46U.jpg) center/cover"
        },
        "164925517": {
            title: "Navalny Forces",
            href: "https://vk.com/testvalny2018",
            background: "url(https://pp.userapi.com/c844722/v844722668/2b9b6/pg0gIuvPAdg.jpg) center/cover"
        },
        "164186528": {
            title: "Developer",
            href: "https://vk.com/vkdevs",
            background: "url(https://pp.userapi.com/c830309/v830309240/bdb00/aifqbjty6_g.jpg) center/cover"
        },
        "164868419": {
            title: "LGBT Forces",
            href: "https://vk.com/testgay",
            background: "url(https://sun1-2.userapi.com/c840530/v840530014/72e1e/kgAEFlcTfS4.jpg) center/cover"
        },
        "157840421": {
            title: "/testmem",
            href: "https://vk.com/testmem",
            background: "url(https://pp.userapi.com/c824200/v824200955/f3887/Fgtw4vKmamw.jpg) center/cover"
        },
        "165001681": {
            title: "Тестач",
            href: "https://vk.com/testac4",
            background: "url(https://pp.userapi.com/c846217/v846217176/2290e/r3Tjn3qCyjI.jpg) center/cover"
        }
    };

    function insertStyles() { // Фукция иниацилизации стилей
        var style = document.createElement("style"); // Создаем элемент стилей
        style.innerHTML = // css стили// css стили
            '.user_checker_icon:last-child { margin-right: 2px; }'+
            'a:hover .user_checker_icon {opacity:1;}'+

            '.user_checker_icon {' +
            '   width: 12px; height: 12px; border-radius: 12px;opacity:.5; box-shadow: inset 0 0 0 1px rgb(106, 152, 204);' +//
            '   display: inline-block;  margin: 0px 1px -1px 2px;outline-offset:-1px;' +
            '   position: relative; transition: transform, margin .2s, .2s;' +
            '}' +
            '.user_checker_icon:first-child { margin-left: 5px; }'+
            '.user_checker_icon:hover {' +
            '    transform: scale(1.2); ' +
            '}';
        document.head.appendChild(style); // Добавляем в залоговок
    }

    function checkLinks(el) { // Функция поиска в элементе ссылок
        var links = el.querySelectorAll('.im-mess-stack--lnk, .author, .friends_field a, .im-member-item--name a, .labeled.name a, .mention_tt_name');
        if (!links) return; // Если в элементе нет ссылок, то пропускаем
        Array.from(links).map(function (link) { // Если есть, то перебираем
            if (link.checked) return; // Если ссылка проверена, то пропускаем
            checkUser(link); // Если есть, то отдаем на проверку
            link.checked = 1; // Отмечаем прочитанной
        });
    }

    function drawIcons(link, info) { // Функция отрисовки иконок
        if (!info.types.length || !info.user_id) return; // Если у юзера его нет или если это не юзер, то выходим
        info.types.map(function (type) { // Перебираем группы
            var icon = document.createElement("a"); // Создаем ссылку
            icon.className = "user_checker_icon"; // назначаем ей класс
            icon.target = "_blank"; // Открывать в новой вкладке
            icon.href = groups[type].href.replace("*", info.user_id); // Ссылка на карточку тестировщика
            icon.style.background = groups[type].background; // Иконка
            icon.onmouseover = function () {
                if(!showTooltip) return;
                showTooltip(icon, {
                    force: 1,
                    black: 1,
                    content: '<div class="tt_text wrapped">' + groups[type].title.replace("*", info.score) + '</div>'
                });
            };
            link.appendChild(icon); // Добавляем ссылку в ссылку
        });
        return info; // Отдаем результат для ссылок ждущих кеша
    }

    var executeCode = function () { // Функция передаваемая в execute для получение исформации о пользователе
        var types = []; // Типы
        var groups = Args.groups.split(","); // id групп
        var ui = API.utils.resolveScreenName(Args); // Получаем id пользователя
        if (ui.type != "user") return {
            types: [],
            user_id: 0
        }; // Если не юзер, то выходим
        //Запрос отчетов
        // Далее проверяем на наличие юзера в группах, если есть, то складываем в типы
        var group = 0; // Доя записи текущей группы;
        var isMember = 0; // Переменная для проверки подписки
        while(groups.length){ // Перебираем группы
            group = groups.shift(); // Первую в списке
            isMember = API.groups.isMember({ // Проверяем подписку
                group_id: group,
                user_id: ui.object_id
            });
            if (isMember) types.push(group); // Если подписан, то записываем это
        }

        // Выводим user_id и подписки
        return {
            types: types,
            user_id: ui.object_id,
        };
    };

    // Преобразуем функцию в строку, для дальнейшего считывания execute
    executeCode = executeCode.toString().replace(/.+?\{([^]+)\}$/, "$1");

    function checkUser(link) { // Проверка пользователя на группы
        var screen_name = link.href.replace(/.+\//, ""); // Убираем из ссылки vk.com и прочее
        if (cache[screen_name] && cache[screen_name].then) // Если в кэше Promise
            return cache[screen_name].then(drawIcons.bind(this, link)); // то ждем ее результат и выводим иконки
        // Если в кэше результат и он не старее суток, то выводим иконки
        if (cache[screen_name] && cache[screen_name].updated > Date.now()) return drawIcons(link, cache[screen_name]);
        cache[screen_name] = API("execute", { // Если нет в кэше, то проверяем ее
            screen_name: screen_name, // Передаем ссылку в execute
            groups: groups.ids, // id групп
            code: executeCode // и код из функции выше
        }).then(function (r) { // Ждем результат
            cache[screen_name] = r.response; // Записываем результат в кэш
            cache[screen_name].updated = Date.now() + 864e5; // Записываем время через которое нужно повторить запрос
            var request = new XMLHttpRequest();
            request.open("GET", "https://itnull.severecloud.me/user.score/"+cache[screen_name].user_id, true);
            request.send();
            request.onreadystatechange = function() { //Запрос отчётов
                if (request.readyState != 4) return;
                var statuss = request.status;
                if(statuss==200)
                    cache[screen_name].score = request.responseText;
            };
            if (r.response.types.length || !r.response.user_id) // Если юзер есть в группах или это не юзер,
                localStorage.devUsersCache2 = JSON.stringify(cache); // то записываем кэш в localStorage
            drawIcons(link, r.response); // Рисуем иконки
            return r.response; // Отдаем остальным
        }).catch(function (e) { // При ошибках
            console.error(e); // Выводим в консоль
        });
    }

    // Создаем обработчик мутаций элемента
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) { // Перебираем обновленя в элементах
            if (mutation.target.nodeType !== 1) return; // Если элемент не блок, то выходим
            checkLinks(mutation.target); // Отдаем элемент на проверку ссылок
        });
    });

    window.addEventListener("load", function () { // Вешаем обработчик на загрузку страницы
        insertStyles(); // Вставляем стили

        if (localStorage.devUserGroups) // Есть ли сохраненный кэш
            groups = JSON.parse(localStorage.devUserGroups); // Загружаем и парсим
        if (localStorage.devUsersCache2) // Есть ли сохраненный кэш
            cache = JSON.parse(localStorage.devUsersCache2); // Загружаем и парсим

        groups.ids = Object.keys(groups).join(","); // id групп для передачи в execute

        loadScript("//ifx.su/~va", { // Загружаем библиотеку для работы с API через /dev/
            onLoad: function () { // Ждем загрузки
                checkLinks(document.body); // Отправляем body на проверку ссылок

                observer.observe(document.body, { // Запускаем обработчик мутаций
                    childList: true, // Проведять детей элемента
                    subtree: true // по всему дереву
                });
            }
        });
    });

}

var script = document.createElement('script'); // Создаем скрипт
script.appendChild(document.createTextNode('(' + DevUsers + ')();')); // Свставляем туда код функции
(document.body || document.head || document.documentElement).appendChild(script); // Добавляем в body или head
var panel = document.createElement("script");
panel.setAttribute("type", "text/javascript");
panel.innerHTML = '(() => {var el = document.getElementsByClassName("page_actions_inner")[0]; if(!el) return;var id = cur.oid || 0;' +
    'var hc = `<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?act=reporter&amp;id=${id}">Карточка тестировщика</a>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&status=100">Отчёты о багах</a>' +
    '<div class="page_actions_separator"></div>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&status=4">На рассмотрении</a>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&status=1">В работе</a>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&status=2">Исправлен</a>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&status=7">Переоткрыт</a>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&status=5">Закрыт</a>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&status=9">Отложен</a>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&status=6">Заблокирован</a>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&status=3">Отклонён</a>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&status=8">Не воспроизводится</a>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&status=99">Неактуальные</a>' +
    '<div class="page_actions_separator"></div>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&severity=4">Критический</a>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&severity=3">Высокий</a>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&severity=2">Средний</a>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/bugtracker?mid=${id}&severity=1">Низкий</a>' +
    '<div class="page_actions_separator"></div>' +
    '<a id="" class="page_actions_item" data-act="1" tabindex="0" role="link" href="/stats?mid=${id}">Статистика</a>' +
    '<div class="page_actions_separator"></div>`;' +
    'if(id > 0) el.insertAdjacentHTML("afterBegin", hc);})()';
document.head.appendChild(panel);