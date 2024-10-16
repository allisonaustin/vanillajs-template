import * as d3 from 'd3';
import axios from 'axios';
import * as d3Sankey from 'd3-sankey';
import { isEmpty, debounce, isUndefined } from 'lodash';

const margin = { left: 40, right: 20, top: 20, bottom: 60 }
var size = { width: 0, height: 0 }

var data = []
let processed = []
data.forEach(p => {
    if (!isNaN(parseInt(p.Age))) {
    let dataObj = {
        age: p.Age,
        value: +p['Hours per day']
    }
    processed.push(dataObj);
    }
})

const onResize = (targets) => {
    targets.forEach(target => {
        if (target.target.getAttribute('id') !== 'sankey-container') return;
        size = { width: target.contentRect.width, height: target.contentRect.height }
        if (!isEmpty(size) && !isEmpty(data)) {
            d3.select('#sankey-svg').selectAll('*').remove()
            //console.log(size, bars)
            initChart()
        }
    })
}

const chartObserver = new ResizeObserver(debounce(onResize, 100))

export const Sankey = () => (
    `<div class='chart-container d-flex' id='sankey-container'>
        <svg id='sankey-svg' width='100%' height='100%'>
        </svg>
    </div>`
)

export function mountChart(chartdata) { // registering this element to watch its size change
    let chartContainer = document.querySelector('#sankey-container')
    chartObserver.observe(chartContainer)
    data = chartdata
}

function groupBy(arr, property) {
    return arr.reduce(function (acc, obj) {
        let key = obj[property];

        if (key != null && key !== undefined) {
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(obj);
        }

        return acc;
    }, {});
}

function levels(value) {
    if (parseInt(value) <= 3) return '0-3'
    if (parseInt(value) > 3 && value < 8) return '4-7'
    if (parseInt(value) <= 10 && value >= 8) return '8-10'
}

function getSankeyData() {
    let sankeydata = {nodes: [], links: []}

    // nodes 
    sankeydata.nodes.push({ "name": 'Listen while working? Yes' })
    sankeydata.nodes.push({ "name": 'Listen while working? No' })
    sankeydata.nodes.push({ "name": 'Anxiety Level 0-3' })
    sankeydata.nodes.push({ "name": 'Anxiety Level 4-7' })
    sankeydata.nodes.push({ "name": 'Anxiety Level 8-10' })
    sankeydata.nodes.push({ "name": "Depression Level 0-3" })
    sankeydata.nodes.push({ "name": "Depression Level 4-7"})
    sankeydata.nodes.push({ "name": "Depression Level 8-10"})
    sankeydata.nodes.push({ "name": 'Music effect on mental health - Improved' })
    sankeydata.nodes.push({ "name": 'Music effect on mental health - Worsened' })
    sankeydata.nodes.push({ "name": 'Music effect on mental health - None' })

    // grouped data
    let genreGrouped = groupBy(data, "Fav genre")
    let workingGrouped = groupBy(data, "While working")
    let anxietyGrouped = groupBy(data, "Anxiety")
    let depressionGrouped = groupBy(data, "Depression")
    let musicEffectGrouped = groupBy(data, "Music effects")
    
    // genre -> listen while working
    let genreWorking = []
    Object.keys(genreGrouped).forEach(g => {
        if (g != "") {
            sankeydata.nodes.push({ "name": g })
        genreWorking = (genreGrouped[g].map(function (obj) {
            return obj['While working']
            }))
    
        // getting counts of each genre for working/not working
        let w_counts = {}
        genreWorking.forEach(g => {
            if (w_counts[g] == null) w_counts[g] = 0
            if (g == 'Yes')
            w_counts[g]++
            else if (g == 'No') {
            w_counts[g]++
            }
        })
        sankeydata.links.push({ "source": g, "target": 'Listen while working? Yes', "value": isNaN(w_counts['Yes']) ? 0 : +w_counts['Yes'] })
        sankeydata.links.push({ "source": g, "target": 'Listen while working? No', "value": isNaN(w_counts['No']) ? 0 : +w_counts['No'] })
        }
    })
    
    // while working -> anxiety
    let anxiety = [];
    Object.keys(workingGrouped).forEach(g => {
        if (g != '' && g !== null && g !== undefined) {
        anxiety = (workingGrouped[g].map(function (obj) {
            return obj['Anxiety']
            }))
        
        let a_counts = {}
        a_counts['0-3'] = 0
        a_counts['4-7'] = 0
        a_counts['8-10'] = 0
        anxiety.forEach(a => {
            if (a <=3 && a >= 0) {
                a_counts['0-3'] += 1;
            } else if (a <=7 && a > 3) {
                a_counts['4-7'] += 1;
            } else if (a <= 10 && a > 7) {
                a_counts['8-10'] += 1;
            }
        });
        sankeydata.links.push({ "source": 'Listen while working? ' + g, "target": 'Anxiety Level 0-3', "value": +a_counts['0-3'] })
        sankeydata.links.push({ "source": 'Listen while working? ' + g, "target": 'Anxiety Level 4-7', "value": +a_counts['4-7'] })
        sankeydata.links.push({ "source": 'Listen while working? ' + g, "target": 'Anxiety Level 8-10', "value": +a_counts['8-10'] })
        }
    })
    
    // anxiety -> depression level
    let depression = [];
    Object.keys(anxietyGrouped).forEach(g => {
        depression = (anxietyGrouped[g].map(function(obj) {
        return obj['Depression']
        }))
    
        let d_counts = {}
        d_counts['0-3'] = 0
        d_counts['4-7'] = 0
        d_counts['8-10'] = 0
        depression.forEach(d => {
        if (d <=3 && d >= 0) {
                d_counts['0-3'] += 1;
            } else if (d <=7 && d > 3) {
                d_counts['4-7'] += 1;
            } else if (d <= 10 && d > 7) {
            d_counts['8-10'] += 1;
            }
        });
        sankeydata.links.push({ "source": 'Anxiety Level ' + levels(g), "target": 'Depression Level 0-3', "value": +d_counts['0-3'] })
        sankeydata.links.push({ "source": 'Anxiety Level ' + levels(g), "target": 'Depression Level 4-7', "value": +d_counts['4-7'] })
        sankeydata.links.push({ "source": 'Anxiety Level ' + levels(g), "target": 'Depression Level 8-10', "value": +d_counts['8-10'] })
    })
    
    
    // depression level -> music helping ?
    let musicEffect = []
    Object.keys(depressionGrouped).forEach(g => {
        if (g != "") {
            musicEffect = (depressionGrouped[g].map(function(obj) {
            return obj['Music effects']
            }))
    
            let e_counts = {}
            musicEffect.forEach(e => {
                if (e_counts[e] == null) e_counts[e] = 0
                if (e == 'Improve') {
                e_counts[e] += 1
                }
                else if (e == 'Worsen') {
                e_counts[e] += 1
                } else if (e == 'No effect') {
                e_counts[e] += 1
                }
            })
        sankeydata.links.push({ "source": 'Depression Level '+ levels(g), "target": 'Music effect on mental health - Improved', "value": isNaN(e_counts['Improve']) ? 0 : +e_counts['Improve'] })
        sankeydata.links.push({ "source": 'Depression Level '+ levels(g), "target": 'Music effect on mental health - Worsened', "value": isNaN(e_counts['Worsen']) ? 0 : +e_counts['Worsen'] })
        sankeydata.links.push({ "source": 'Depression Level '+ levels(g), "target": 'Music effect on mental health - None', "value": isNaN(e_counts['No effect']) ? 0 : +e_counts['No effect'] })
        }
    })
    return sankeydata
}

function initChart() {
    let chartContainer = d3.select('#sankey-svg')
    let sankeyData = getSankeyData();
    const format = d3.format(",.0f");
    
    // Constructs and configures a Sankey generator.
    let sankey = d3Sankey.sankey()
        .nodeId(d => d.name)
        .nodeAlign(d3Sankey.sankeyLeft) // d3.sankeyLeft, etc.
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[1, 5], [size.width - 1, size.height - 5]]);

    const {nodes, links} = sankey({
        nodes: sankeyData.nodes.map(d => Object.assign({}, d)),
        links: sankeyData.links.map(d => Object.assign({}, d))
    });
    
    const colors = d3.scaleOrdinal(d3.schemeTableau10);

    // Creates the rects that represent the nodes.
    const rect = chartContainer.append("g")
        .attr("stroke", "#000")
        .selectAll()
        .data(nodes)
        .join("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => colors(d.name))
        .attr("opacity", 0.5);

    // Adds a title on the nodes.
    rect.append("title")
        .text(d => `${d.name}\n${format(d.value)} TWh`);

    // Creates the paths that represent the links.
    const link = chartContainer.append("g")
        .attr("fill", "none")
        .attr("stroke-opacity", 0.5)
        .selectAll()
        .data(links)
        .join("g")
        .style("mix-blend-mode", "multiply");

    link.append("path")
        .attr("d", d3Sankey.sankeyLinkHorizontal())
        .attr("stroke", (d) => d.uid)
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("stroke", d => colors(d.source))
        .attr("opacity", 0.3);

    link.append("title")
        .text(d => `${d.source} → ${d.target}\n${format(d.value)} TWh`);

    // Adds labels on the nodes.
    chartContainer.append("g")
        .selectAll()
        .data(nodes)
        .join("text")
        .attr("x", d => d.x0 < size.width / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < size.width / 2 ? "start" : "end")
        .text(d => d.name);

}


