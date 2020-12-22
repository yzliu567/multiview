let _width = $(window).width();
let _height = $(window).height();
let width = 0.9 * _width;
let height = 0.96 * _height;

let x_attr = 'Ph.D. Graduation Year';
let y_attr = 'Publications';
let col_attr = 'Citations';
let rad_attr = 'H-index';
let backup1;
var color = d3.scaleOrdinal(d3.schemeCategory10);

let data_file2 = './data/data.json';

let nodes_backup, links_backup, force_direct_flag=0;

let nodes_dict = {};
let bgcolor = d3.color("rgba(240, 240, 240, 0.9)");

let colforce1 = d3.rgb(247,68,97);
let colforce3 = d3.rgb(87,96,105);
let colforce2 = d3.rgb(173,195,192);

function getc(w){
    if(w>40) return colforce1;
    else if(w>5) return colforce2;
    else return colforce3;
}

let haslinks = []
let text;
let clicking = false;
let choosing = false;
let ins,ins2;
let svg,svg2,svg3;
let ggg = 75;
function draw_graph() {
    svg = d3.select('#container')
        .select('svg')
        .attr('width', width)
        .attr('height', height);

    let padding = {'left': 0.15*width, 'bottom': 0.1*height, 'top': 0.2*height, 'right': 0.25*width};
    // title
    svg.append('g')
        .attr('transform', `translate(${padding.left+(width-padding.left-padding.right)/2*1.2}, ${padding.top*0.4})`)
        .append('text')
        .attr('class', 'title')
        .text('Multiple-view Interactive Visualization of Computer Science Faculties in Well-known Schools');


    let x = d3.scaleLinear()
        .domain(get_min_max(data1, x_attr))
        .range([0.65*width, 0.98*width]);
    let axis_x = d3.axisBottom()
        .scale(x)
        .ticks(10)
        .tickFormat(d => d);

    // y axis - publications
    let y = d3.scaleLinear()
        .domain(get_min_max(data1, y_attr))
        .range([height-padding.bottom, 0.5*height]);
    let axis_y = d3.axisLeft()
        .scale(y)
        .ticks(10)
        .tickFormat(d => d);

    // x axis
    svg.append('g')
        .attr('transform', `translate(${0}, ${height-padding.bottom})`)
        .call(axis_x)
        .attr('font-family', fontFamily)
        .attr('font-size', '0.8rem')

    svg.append('g')
        .attr('transform', `translate(${0.825*width}, ${height-padding.bottom})`)
        .append('text')
        .attr('class', 'axis_label')
        .attr('dx', '-0.4rem')
        .attr('dy', 0.08*height)
        .text(x_attr);

    // y axis
    svg.append('g')
        .attr('transform', `translate(${0.65*width}, ${0})`)
        .call(axis_y)
        .attr('font-family', fontFamily)
        .attr('font-size', '0.6rem')
    svg.append('g')
        .attr('transform', `
            translate(${0.65*width}, ${0.7*height})
            rotate(-90)
        `)
        .append('text')
        .attr('class', 'axis_label')
        .attr('dy', -height*0.07)
        .text(y_attr);

    // points
    var radi = d3.scaleLinear().domain(get_min_max(data1, rad_attr)).range([0.75,5]);

    svg.append('g')
        .selectAll('.scatterpoint')
        .data(data1)
        .enter().append('circle')
        .attr('class', 'scatterpoint')
        .attr('cx', (d, i) => {
            //console.log('data', d);
            return x(parseInt(d[x_attr]));
        })
        .attr('cy', (d, i) => y(parseInt(d[y_attr])))
        .attr('r', d=> radi(d[rad_attr]))

        .style('fill', (d) =>{
            return colscatter1;
        })

        .on('mouseover', (e, d) => {

            let name = d['First Name'] + ' ' + d['Mid Name'] + ' ' + d['Last Name'];
            let institution = d['Institution'];
            let grad_year = d['Ph.D. Graduation Year'];
            let grad_school = d['Ph.D. Graduate School'];
            let pubs = d['Publications'];
            let cits = d['Citations'];
            let interest = d['Research Interest'];
            //console.log('data', d);


            let content = '<table><tr><td>Name</td><td>' + name + '</td></tr>'
                + '<tr><td>Institution</td><td>'+ institution + '</td></tr>'
                + '<tr><td>Research Interest</td><td>'+ interest + '</td></tr>'
                + '<tr><td>Ph.D. Graduation Year</td><td>'+ grad_year + '</td></tr>'
                + '<tr><td>Ph.D. Graduation School</td><td>'+ grad_school + '</td></tr>'
                + '<tr><td>Publications</td><td>'+ pubs + '</td></tr>'
                + '<tr><td>Citations</td><td>'+ cits + '</td></tr></table>';

            // tooltip
            let tooltip = d3.select('#tooltip');
            tooltip.html(content)
                .style('left', (x(parseInt(d[x_attr])) - 200) + 'px')
                .style('top', (y(parseInt(d[y_attr])) - 200)+ 'px')
                //.transition().duration(500)
                .style('visibility', 'visible');
        })
        .on('mouseout', (e, d) => {

            // remove tooltip
            let tooltip = d3.select('#tooltip');
            tooltip.style('visibility', 'hidden');
        })
    // 数据格式
    // nodes = [{"id": 学校名称, "weight": 毕业学生数量}, ...]
    // links = [{"source": 毕业学校, "target": 任职学校, "weight": 人数}, ...]
    let links = data2.links;
    let nodes = data2.nodes;
    //len(nodes)=256 len(links)=846
    //console.log(links.length, nodes.length)
    // 图布局算法
    let simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width * 0.3, height * 0.5));

        function drag(simulation) {
            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }
    //if(force_direct_flag==0) graph_layout_algorithm(nodes, links);

    for(i in nodes){
        nodes[i].rawcolor=getc(nodes[i].weight);
        let compute = d3.interpolate(bgcolor,nodes[i].rawcolor);
        nodes[i].fcolor=compute(0.2);
    }

    let n=nodes.length;
    let m=links.length;
    name2id={};
    for(let i=0;i<n;i++){
        name2id[nodes[i].id] = i;
    }
    for(let i=0;i<m;i++){
        links[i].from = name2id[links[i].source.id]
        links[i].to = name2id[links[i].target.id]
    }
    for(let i in nodes){
        haslinks[i]=[];
        for(let j in nodes)
            haslinks[i][j]=0;
    }
    for(let i in links){
        //console.log(links[i].from, links[i].to)
        haslinks[links[i].from][links[i].to] = 1;
        haslinks[links[i].to][links[i].from] = 1;
    }
    for (i in nodes) {
        nodes_dict[nodes[i].id] = nodes[i]
    }

    // links
    let link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll(".linkline")
        .data(links)
        .join("line")
        .attr("class", "linkline")
        .attr("stroke-width", d => Math.sqrt(d.weight));

    // nodes
    let node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .selectAll(".forcepoint")
        .data(nodes)
        .join("circle")
        .attr("class", "forcepoint")
        .attr("r", d => Math.sqrt(d.weight)*1.3 + 0.5)
        .attr("fill", d=>d.rawcolor)
        .on("mouseover", function (e, d) {// 鼠标移动到node上时显示text
            if(!choosing){
            text
                .attr("display", function (f) {
                    if (f.id == d.id || f.weight > 40) {
                        return "null";
                    }
                    else {
                        return "none";
                    }
                })
            }
            else{
                text.attr("display", function(f){
                    if(f.id == d.id || f.id == ins || f.id ==ins2){
                        return "null";
                    }
                    else{
                        return "none";
                    }
                });
            }
        })
        .on("mouseout", function (e, d) {// 鼠标移出node后按条件判断是否显示text
            if(!choosing){
            text
                .attr("display", function (f) {
                    if (f.weight > 40) {
                        return 'null';
                    }
                    else {
                        return 'none';
                    }
                })
            }
            else{
                text.attr("display", function(f){
                    if(f.id == ins || f.id ==ins2){
                        return "null";
                    }
                    else{
                        return "none";
                    }
                });
            }
        })
        .call(drag(simulation));

    // 学校名称text，只显示满足条件的学校
    text = svg.append("g")
        .selectAll(".forcenodetext")
        .data(nodes)
        .join("text")
        .attr("class", "forcenodetext")
        .text(d => d.id)
        .attr("display", function (d) {
            if (d.weight > 40) {
                return 'null';
            }
            else {
                return 'none';
            }
        });

    // 绘制links, nodes和text的位置
    // title

    // 绘制links和nodes
    simulation.on("tick", () => {
        node
            .attr("cx", d=>d.x)
            .attr("cy", d=>d.y);
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        text
            .attr("x", d=>d.x)
            .attr("y", d=>d.y);
    });
    svg2 = d3.select("#my_dataviz")
              .append("svg")
                .attr("width", ggg*2+10)
                .attr("height", ggg*2+10)
              .append("g")
                .attr("transform", "translate(" + (ggg+5) + "," + (ggg+5) + ")");
    svg3 = d3.select("#my_dataviz2")
                .append("svg")
                  .attr("width", ggg*2+10)
                  .attr("height", ggg*2+10)
                .append("g")
                  .attr("transform", "translate(" + (ggg+5) + "," + (ggg+5) + ")");
    show_ins();
}


function changey() {
    force_direct_flag=1;
    d3.selectAll('svg > *').remove();
    data1 = backup1.filter((d, i) => (d[x_attr] != '' && d[y_attr] != '' && d[rad_attr] != ''));
    y_attr = document.getElementById('y_ax').value;
    draw_graph();
    //show_ins();
}

let fontFamily;
let Insnames = [
    'Carnegie Mellon University',
    'Massachusetts Institute of Technology',
    'University of California - Berkeley',
    'Stanford University',
    'University of Illinois at Urbana-Champaign',
    'University of California - San Diego',
    'University of Maryland - College Park',
    'University of Washington',
    'Cornell University',
    'University of Michigan',
    'Georgia Institute of Technology',
    'Swiss Federal Institute of Technology Zurich',
    'Columbia University',
    'University of Wisconsin - Madison',
    'University of California - Los Angeles',
    'Israel Institute of Technology',
    'University of Pennsylvania',
    'University of Texas at Austin',
    'University of Toronto',
    'Tsinghua University',
    'Peking University',
    'The Hong Kong University of Science and Technology',
    'Chinese University of Hong Kong',
    'Shanghai Jiao Tong University',
    'Zhejiang University',
    'Nanjing University',
    'Fudan University'
];

let inte2id={
    'Machine learning & data mining': 0,
    'Artificial intelligence': 1,
    'Computer vision': 2,
    'Algorithms & complexity': 3,
    'Human-computer interaction': 4,
    'Computer architecture': 5,
    'Natural language processing': 6,
}

var colscatter1 = d3.rgb(254,67,101);
var colscatter2 = d3.rgb(131,175,155);
var colscatter3 = d3.rgb(200,200,169);
var colscatter4 = d3.rgb(249,205,173);
var intes_map;
let fff=0,fff2=0;
function show_ins(){
    ins = document.getElementById("Insnms").value;

    ins2 = document.getElementById("Insnms2").value;
    if(ins == 'All'){
        if(fff) svg2.selectAll('*').remove();
        if(fff2) svg3.selectAll('*').remove();
        clicking = false;
        choosing = false;
        d3.selectAll('.scatterpoint').style("visibility", "visible").style('fill',colscatter1);
        d3.selectAll('.forcepoint').style("visibility", "visible").style('fill',d=>d.rawcolor);
        d3.selectAll('.linkline').style('visibility', 'visible');

        text
            .attr("display", function (f) {
                if (f.weight > 40) {
                    return 'null';
                }
                else {
                    return 'none';
                }
            })


    }
    else{
        clicking = true;
        choosing = true;
        d3.selectAll('.scatterpoint').style("visibility", (d)=>{
            return d["Institution"] == ins || d["Institution"] == ins2 ? "visible" : "hidden";
        }).style('fill', (d)=>{
            return d["Institution"] == ins ? colscatter1 : colscatter2;
        });

        d3.selectAll('.forcepoint').style("visibility", (d)=>{
            return d.id == ins || d.id==ins2 || (haslinks[name2id[d.id]][name2id[ins]]||haslinks[name2id[d.id]][name2id[ins2]]) ? "visible":"hidden";
        }).style('fill', (d)=>{
            if(d.id == ins) return colscatter1;
            else if (d.id==ins2) return colscatter2;
            else if (haslinks[name2id[d.id]][name2id[ins]]&&(ins2!='None'&&haslinks[name2id[d.id]][name2id[ins2]])) return colscatter3;
            else return colscatter4;
        });
        text
                .attr("display", function (f) {
                    if (f.id ==ins || f.id == ins2) {
                        return 'null';
                    }
                    else {
                        return 'none';
                    }
                })

        d3.selectAll('.linkline').style("visibility", (d)=>{
            //console.log(d.source.id, d.target.id);
            if(ins2 == 'None'){
                if (d.source.id==ins || d.target.id ==ins) return "visible";
                else return "hidden";
            }
            else{
                if(d.source.id == ins || d.target.id == ins2||d.source.id == ins2 || d.target.id == ins) return "visible";
                else return "hidden";
            }
        })

            if(fff) svg2.selectAll('*').remove();
            fff=1;

            var radius = ggg
            var data = intes_map[ins];
            console.log(data);

            // Compute the position of each group on the pie:
            var pie = d3.pie()
              .value(function(d) {return d[1];})
            var data_ready = pie(Object.entries(data))

            // Now I know that group A goes from 0 degrees to x degrees and so on.

            // shape helper to build arcs:
            var arcGenerator = d3.arc()
              .innerRadius(0)
              .outerRadius(radius)


            // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
            svg2
              .selectAll('mySlices')
              .data(data_ready)
              .enter()
              .append('path')
                .attr('d', arcGenerator)
                .attr('fill', function(d){return(color(inte2id[d.data[0]])) })
                .attr("stroke", "black")
                .style("stroke-width", "2px")
                .style("opacity", 0.7)

            // Now add the annotation. Use the centroid method to get the best coordinates
            svg2
              .selectAll('mySlices')
              .data(data_ready)
              .enter()
              .append('text')
              .text(function(d){ return d.data[0]})
              .attr("transform", function(d) { return "translate(" + arcGenerator.centroid(d) + ")";  })
              .style("text-anchor", "middle")
              .style("font-size", 8)





            if(fff2) svg3.selectAll('*').remove();
            if(ins2== 'None')return;
            fff2=1;
            var radius = ggg
            var data = intes_map[ins2];
            console.log(data);

            // Compute the position of each group on the pie:
            var pie = d3.pie()
              .value(function(d) {return d[1];})
            var data_ready = pie(Object.entries(data))

            // Now I know that group A goes from 0 degrees to x degrees and so on.

            // shape helper to build arcs:
            var arcGenerator = d3.arc()
              .innerRadius(0)
              .outerRadius(radius)


            // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
            svg3
              .selectAll('mySlices')
              .data(data_ready)
              .enter()
              .append('path')
                .attr('d', arcGenerator)
                .attr('fill', function(d){return(color(inte2id[d.data[0]])) })
                .attr("stroke", "black")
                .style("stroke-width", "2px")
                .style("opacity", 0.7)

            // Now add the annotation. Use the centroid method to get the best coordinates
            svg3
              .selectAll('mySlices')
              .data(data_ready)
              .enter()
              .append('text')
              .text(function(d){ return d.data[0]})
              .attr("transform", function(d) { return "translate(" + arcGenerator.centroid(d) + ")";  })
              .style("text-anchor", "middle")
              .style("font-size", 8)

    }
}

function set_selection(){
    select = document.getElementById('Insnms');
    var opt = document.createElement('option');
    opt.value = 'All';
    opt.text = 'All';
    select.appendChild(opt);
    for (var i=0;i<Insnames.length;i++){
        var opt = document.createElement('option');
        opt.value = Insnames[i];
        opt.text = Insnames[i];
        select.appendChild(opt);
    }
}

function set_selection2(){
    select = document.getElementById('Insnms2');
    var opt = document.createElement('option');
    opt.value = 'None';
    opt.text = 'None';
    select.appendChild(opt);
    for (var i=0;i<Insnames.length;i++){
        var opt = document.createElement('option');
        opt.value = Insnames[i];
        opt.text = Insnames[i];
        select.appendChild(opt);
    }
}

function set_ui() {
    // 设置字体
    let ua = navigator.userAgent.toLowerCase();
    fontFamily = "Khand-Regular";
    if (/\(i[^;]+;( U;)? CPU.+Mac OS X/gi.test(ua)) {
        fontFamily = "PingFangSC-Regular";
    }
    d3.select("body")
        .style("font-family", fontFamily);
}
function set_interst(){
    let num = data1.length;
    intes_map = {}
    for(i in Insnames){
        intes_map[Insnames[i]] = {};
    }
    fs_map = {};
    for(i=0;i<num;i++){
        if(!intes_map[data1[i]["Institution"]]) continue;
        intes = data1[i]["Research Interest"].split(',');
        for(j in intes){
            if(!inte2id.hasOwnProperty(intes[j])) continue;
            if(!intes_map[data1[i]['Institution']][intes[j]]) intes_map[data1[i]['Institution']][intes[j]]=0;
            intes_map[data1[i]['Institution']][intes[j]]++;

            if(!fs_map[intes[j]]) fs_map[intes[j]]=0;
            fs_map[intes[j]]++;
        }
    }
    console.log(fs_map);
}

function main() {
    set_selection();
    set_selection2();
    d3.json(data_file2).then(function (DATA2) {
        data2=DATA2;
        d3.csv(data_file1).then(function(DATA1) {
            backup1 = DATA1;
            data1 = DATA1;
            // remove data without x_attr or y_attr
            data1 = data1.filter((d, i) => (d[x_attr] != '' && d[y_attr] != '' && d[rad_attr] != ''));
            set_ui();
            set_interst();
            draw_graph();
        })
    })
}

main()
