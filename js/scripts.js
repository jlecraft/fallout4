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
                const rankClass = perk.currentRank > 0 ? ' rank-active' : '';
                const disableDec = perk.currentRank <= 0 ? ' disabled' : '';
                const disableInc = perk.currentRank >= perk.ranks ? ' disabled' : '';
                html += '<div class="overlay"><button class="btn btn-xs btn-danger btn-dec-perk"' + disableDec + '><i class="glyphicon glyphicon-minus"></i></button>&nbsp;<span class="rank-display' + rankClass + '">' + perk.currentRank + '/' + perk.ranks + '</span>&nbsp;<button class="btn btn-xs btn-success btn-inc-perk"' + disableInc + '><i class="glyphicon glyphicon-plus"></i></button></div>';
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

    $('.special-value').each(function () {
        specs.push($(this).text());
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
        let value = parseInt($(this).find('.special-value').text());
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
    return totalPoints - getAllocatedPoints();
}

const renderRequiredLevel = function () {
    $('.unspent-stats').text(unspentStats());
    $('.required-level-perks').text(requiredLevelPerks());
    $('.required-level-points').text(requiredLevelPoints());
}

const renderSpecialButtons = function () {
    $('[data-special]').each(function () {
        const value = parseInt($(this).find('.special-value').text());
        $(this).find('.btn-dec').prop('disabled', value <= 1);
        $(this).find('.btn-inc').prop('disabled', value >= 10);
    });
}

const renderAll = function () {
    renderPerks();
    renderRequiredLevel();
    renderSummary();
    renderSpecialButtons();
    window.location.hash = '#' + getJSON();
}

const getAllocatedPoints = function () {
    return $('.special-value').map(function () {
        return parseInt($(this).text());
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

    const reqLevel = Math.max(requiredLevelPerks(), requiredLevelPoints());

    let html = '';
    for (let level = 2; level <= reqLevel; ++level) {
        const hasPerks = levelMap[level] && levelMap[level].length > 0;
        const headingClass = hasPerks ? 'level-heading' : 'level-heading level-free';
        html += '<div class="' + headingClass + '">Level ' + level + '</div>';
        if (hasPerks) {
            html += '<ul class="level-perks">';
            for (let p = 0; p < levelMap[level].length; ++p) {
                html += '<li>' + levelMap[level][p] + '</li>';
            }
            html += '</ul>';
        }
    }

    $('.summary').html(html);
    $('[rel="popover"]').popover();
}

$(function () {
    const hash = window.location.hash.replace('#', '');

    if (hash.length > 0) {
        const load = JSON.parse(atob(hash));

        $('.special-value').each(function (index) {
            $(this).text(load.s[index]);
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
              $span = $li.find('.special-value'),
              value = parseInt($span.text());

        if (value < 10) {
            $span.text(value + 1);
        }

        renderAll();
    });

    $('.btn-dec').on('click', function () {
        const $li = $(this).parent().parent(),
              $span = $li.find('.special-value'),
              value = parseInt($span.text()),
              special = $li.data('special');

        if (value > 1) {
            $span.text(value - 1);

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
