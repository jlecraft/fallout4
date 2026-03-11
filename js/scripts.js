const totalPoints = 29;

const renderPerks = function () {
    let html = '',
    special = getSPECIAL();

    html += '<tr>';

    for (let i = 0; i < special.length; ++i) {
        html += '<th>' + special[i].special.toUpperCase() + ': ' + special[i].value + '</th>';
    }

    html += '</tr>';

    for (let i = 0; i <= 9; ++i) {
        html += '<tr>';

        for (let j = 0; j < perks.length; ++j) {
            let perk = perks[j].perks[i],
                className = i > special[j].value - 1 ? ' unavailable' : '';

            if (!perk.currentRank) {
                perk.currentRank = 0;
            }

            const title = perk.ranked.map(function (rank) {
                const rankClass = perk.currentRank >= rank.rank ? 'has-rank' : 'no-rank';
                return '<p class=' + rankClass + '>Rank ' + rank.rank + ' (' + rank.level + '): ' + rank.description + '</p>';
            }).join('');

            html += '<td><div data-placement="left" data-trigger="hover" data-original-title="' + perk.name + '" rel="popover" data-html="true" data-content="' + title + '" data-i="' + i + '" data-j="' + j + '" class="perk' + className + '" style="background-image:url(\'img/' + perk.img + '\');">';

            if (className !== ' unavailable') {
                html += '<div class="overlay"><button class="btn btn-xs btn-danger btn-dec-perk"><i class="glyphicon glyphicon-minus"></i></button>&nbsp;' + perk.currentRank + '/' + perk.ranks + '&nbsp;<button class="btn btn-xs btn-success btn-inc-perk"><i class="glyphicon glyphicon-plus"></i></button></div>';
            }

            html += '</td>';
        }
        html += '</tr>';
    }

    $('.table').html(html);
}

const getJSON = function () {
    return btoa(JSON.stringify({
        s: getSPECIALShort(),
        r: getRanks(),
        b: getBobbleheads()
    }));
}

const getRanks = function () {
    const ranks = [];

    for (let i = 0; i < perks.length; ++i) {
        for (let j = 0; j < perks[i].perks.length; ++j) {
            const perk = perks[i].perks[j];
            if (perk.currentRank && perk.currentRank > 0) {
                const item = {};
                item[perk.name] = perk.currentRank;
                ranks.push(item);
            }
        }
    }

    return ranks;
}

const getSPECIALShort = function () {
    const specs = [];

    $('input[type="number"]').each(function () {
        specs.push($(this).val());
    });

    return specs;
};

const getBobbleheads = function () {
    const bobs = [];
    $('.bobblehead-check').each(function () {
        bobs.push($(this).is(':checked'));
    });
    return bobs;
};

const getSPECIAL = function () {
    return $('[data-special]').map(function () {
        let value = parseInt($(this).find('input[type="number"]').val());
        if ($(this).find('.bobblehead-check').is(':checked')) {
            value += 1;
        }
        return {
            special: $(this).data('special'),
            value: value
        };
    });
};

const requiredLevelPerks = function () {
    let maxLevel = 0;

    for (let i = 0; i < perks.length; ++i) {
        for (let j = 0; j < perks[i].perks.length; ++j) {
            const perk = perks[i].perks[j];
            if (!perk.currentRank) continue;
            for (let k = 0; k < perk.currentRank; ++k) {
                if (perk.ranked[k].level > maxLevel) {
                    maxLevel = perk.ranked[k].level;
                }
            }
        }
    }

    return maxLevel || 1;
}

const requiredLevelPoints = function () {
    let totalPerkRanks = 0;
    for (let i = 0; i < perks.length; ++i) {
        for (let j = 0; j < perks[i].perks.length; ++j) {
            totalPerkRanks += perks[i].perks[j].currentRank || 0;
        }
    }

    let remaining = totalPoints - getAllocatedPoints();
    if (remaining < 0) remaining = 0;

    let pointLevels = 0;
    if (remaining <= 0) {
        const overspent = getAllocatedPoints() - totalPoints;
        pointLevels = 1 + overspent;
    }

    const total = totalPerkRanks + pointLevels;
    return total || 1;
}

const unspentStats = function () {
    const remaining = totalPoints - getAllocatedPoints();
    return remaining > 0 ? remaining : 0;
}

const freeLevels = function () {
    const reqLevel = Math.max(requiredLevelPerks(), requiredLevelPoints());
    if (reqLevel <= 1) return { count: 0, levels: [] };

    const usedLevels = {};
    for (let i = 0; i < perks.length; ++i) {
        for (let j = 0; j < perks[i].perks.length; ++j) {
            const perk = perks[i].perks[j];
            if (!perk.currentRank || perk.currentRank === 0) continue;
            for (let k = 0; k < perk.currentRank; ++k) {
                const level = perk.ranked[k].level <= 1 ? 2 : perk.ranked[k].level;
                usedLevels[level] = true;
            }
        }
    }

    const levels = [];
    for (let lvl = 2; lvl <= reqLevel; ++lvl) {
        if (!usedLevels[lvl]) {
            levels.push(lvl);
        }
    }
    return { count: levels.length, levels: levels };
}

const renderRequiredLevel = function () {
    $('.unspent-stats').text(unspentStats());
    $('.required-level-perks').text(requiredLevelPerks());
    $('.required-level-points').text(requiredLevelPoints());
    const free = freeLevels();
    if (free.count === 0) {
        $('.free-levels').text('0');
    } else {
        const ranges = [];
        let start = free.levels[0];
        let end = start;
        for (let i = 1; i < free.levels.length; ++i) {
            if (free.levels[i] === end + 1) {
                end = free.levels[i];
            } else {
                ranges.push(start === end ? '' + start : start + '-' + end);
                start = free.levels[i];
                end = start;
            }
        }
        ranges.push(start === end ? '' + start : start + '-' + end);
        $('.free-levels').text('(' + free.count + ') ' + ranges.join(', '));
    }
}

const renderAll = function () {
    renderPerks();
    renderRequiredLevel();
    renderSummary();
    window.location.hash = '#' + getJSON();
}

const getAllocatedPoints = function () {
    return $('[data-special] input[type="number"]').map(function () {
        return parseInt($(this).val());
    }).get().reduce(function (prev, curr) {
        return prev + curr;
    });
}

const renderSummary = function () {
    const levelMap = {};

    for (let i = 0; i < perks.length; ++i) {
        for (let j = 0; j < perks[i].perks.length; ++j) {
            const perk = perks[i].perks[j];
            if (!perk.currentRank || perk.currentRank === 0) continue;

            for (let k = 0; k < perk.currentRank; ++k) {
                const rankInfo = perk.ranked[k];
                const level = rankInfo.level <= 1 ? 2 : rankInfo.level;

                if (!levelMap[level]) {
                    levelMap[level] = [];
                }
                levelMap[level].push(perk.name + ' (' + rankInfo.rank + ')');
            }
        }
    }

    const levels = Object.keys(levelMap).map(Number).sort(function (a, b) { return a - b; });

    let html = '';
    for (let i = 0; i < levels.length; ++i) {
        const level = levels[i];
        html += '<div class="level-heading">Level ' + level + '</div>';
        html += '<ul class="level-perks">';
        for (let p = 0; p < levelMap[level].length; ++p) {
            html += '<li>' + levelMap[level][p] + '</li>';
        }
        html += '</ul>';
    }

    $('.summary').html(html);
    $('[rel="popover"]').popover();
}

$(function () {
    const hash = window.location.hash.replace('#', '');

    if (hash.length > 0) {
        const load = JSON.parse(atob(hash));

        $('input[type=number]').each(function (index) {
            $(this).val(load.s[index]);
        });

        if (load.b) {
            $('.bobblehead-check').each(function (index) {
                $(this).prop('checked', load.b[index]);
            });
        }

        for (let i = 0; i < load.r.length; ++i) {
            const key = Object.keys(load.r[i])[0], value = load.r[i][key];

            for (let j = 0; j < perks.length; ++j) {
                for (let k = 0; k < perks[j].perks.length; ++k) {
                    let perk = perks[j].perks[k];

                    if (perk.name === key) {
                        perk.currentRank = value;
                    }
                }
            }
        }
    }

    renderAll();

    $('.btn-reset').on('click', function (e) {
        e.preventDefault();
        window.location.href = window.location.pathname;
    });

    $('.bobblehead-check').on('change', function () {
        renderAll();
    });

    $('.btn-inc').on('click', function () {
        const $li = $(this).parent().parent(),
              $input = $li.find('input[type="number"]'),
              value = parseInt($input.val());

        if (value < 10) {
            $input.val(value + 1);
        }

        renderAll();
    });

    $('.btn-dec').on('click', function () {
        const $li = $(this).parent().parent(),
              $input = $li.find('input[type="number"]'),
              value = parseInt($input.val()),
              special = $li.data('special');

        if (value > 1) {
            $input.val(value - 1);

            for (let i = 0; i < perks.length; ++i) {
                if (perks[i].special === special) {
                    const effectiveValue = value - 1 + ($li.find('.bobblehead-check').is(':checked') ? 1 : 0);
                    for (let j = effectiveValue; j < perks[i].perks.length; ++j) {
                        perks[i].perks[j].currentRank = 0;
                    }
                }
            }
        }

        renderAll();
    });

    $('body').on('click', '.btn-inc-perk, .btn-dec-perk', function () {
        const $container = $(this).parent().parent(),
              i = parseInt($container.data('i')),
              j = parseInt($container.data('j')),
              perk = perks[j].perks[i],
              incrementing = $(this).hasClass('btn-inc-perk');

        if (!perk.currentRank) {
            perk.currentRank = 0;
        }

        if (incrementing) {
            if (perk.currentRank < perk.ranks) {
                perk.currentRank += 1;
            }
        } else {
            if (perk.currentRank > 0) {
                perk.currentRank -= 1;
            }
        }

        renderAll();
    });
});
