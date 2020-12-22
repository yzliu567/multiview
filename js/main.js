let _width = $(window).width();
let _height = $(window).height();
let width = 0.9 * _width;
let height = 0.96 * _height;

let x_attr = 'Ph.D. Graduation Year';
let y_attr = 'Publications';
let col_attr = 'Citations';
let rad_attr = 'H-index';
let backup1;

let data_file2 = './data/data.json';

let raw_l1=2,raw_l2=1e-6,raw_iters=500;
let lambda1=2,lambda2=1e-6,lambda3=0,iters=500;

function get_distance(a,b){
    return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
}

function repulsive(nodes,i,j){
    let dist = get_distance(nodes[i],nodes[j]);
    let fs = -lambda1 * nodes[i].weight * nodes[j].weight/(dist);
    //fs = clip(fs);
    let dy = nodes[j].y - nodes[i].y, dx = nodes[j].x -nodes[i].x;
    return {x: fs*dx/dist, y: fs*dy/dist}
}

function attractive(nodes,i,j,w){
    let dist = get_distance(nodes[i],nodes[j]);
    //let len = lambda3 * nodes[i].weight * nodes[j].weight;
    //let fs = lambda2 * (dist*dist/len - len*len/dist);
    let fs = lambda2 * w * dist * dist;
    if(nodes[i].weight<=3 && nodes[j].weight>15) fs *= 10;
    if(nodes[j].weight<=3 && nodes[i].weight>15) fs *= 10;
    //fs = clip(fs);
    let dy = nodes[j].y - nodes[i].y, dx = nodes[j].x -nodes[i].x;
    return {x: fs*dx/dist, y: fs*dy/dist}
}


function normalize(nodes) {
    n = nodes.length;
    let max_x=nodes[0].x,max_y=nodes[0].y,min_x=nodes[0].x,min_y=nodes[0].y;
    for(let i=1;i<n;++i) {
        max_x=Math.max(max_x,nodes[i].x);
        min_x=Math.min(min_x,nodes[i].x);
        max_y=Math.max(max_y,nodes[i].y);
        min_y=Math.min(min_y,nodes[i].y);
    }
    for(let i=0;i<n;++i) {
        nodes[i].x = (nodes[i].x-min_x)/(max_x-min_x)*0.7*width+0.05*width;
        nodes[i].y = (nodes[i].y-min_y)/(max_y-min_y)*0.8*height+0.1*height;
    }
}

function modified_FR(nodes, links){
    let n=nodes.length;
    let m=links.length;
    name2id={};
    for(let i=0;i<n;i++){
        name2id[nodes[i].id] = i;
    }
    for(let i=0;i<m;i++){
        links[i].from = name2id[links[i].source]
        links[i].to = name2id[links[i].target]
    }
    for(let i=0;i<n;i++){
        nodes[i].x = Math.random() * 0.8 * width + 0.1 * width;
        nodes[i].y = Math.random() * 0.8 * height + 0.1 * height;
    }
    for(let it=1;it<=iters;it++){
        //console.log(it)
        force=[]
        //tmp=0;
        for(let i=0;i<n;i++){
            force[i]={x:0,y:0};
            for(let j=0;j<n;j++){
                if(i!=j){
                    let fs = repulsive(nodes,i,j);
                    force[i].x+=fs.x;
                    force[i].y+=fs.y;
                    //console.log(fs.x, fs.y)
                    //tmp = Math.max(tmp, Math.max(Math.abs(fs.x),Math.abs(fs.y)))
                }
            }
        }
        //console.log('repulsive',tmp);
        //tmp=0;
        for(let e=0;e<m;e++){
            let x = links[e].from;
            let y = links[e].to;
            if(x==y) continue;
            let fs = attractive(nodes, x, y, links[e].weight);
            force[x].x+=fs.x;
            force[x].y+=fs.y;
            force[y].x-=fs.x;
            force[y].y-=fs.y;
            //tmp = Math.max(tmp, Math.max(Math.abs(fs.x),Math.abs(fs.y)))
        }
        //console.log('attractive', tmp);
        cg =0;
        for(let i=0;i<n;i++){
            cg = Math.max(cg, Math.max(force[i].x, force[i].y));
            nodes[i].x += force[i].x;
            nodes[i].y += force[i].y;
        }
        //console.log(it, cg);
        //normalize(nodes);
        //tmp*=0.9;
    }
    normalize(nodes);
    for(i in nodes){
        if(isNaN(nodes[i].x) || isNaN(nodes[i].y)){
            console.log("Crash");
            redraw();
        }
    }
}
let nodes_backup, links_backup, force_direct_flag=0;
// 需要实现一个图布局算法，给出每个node的x,y属性
function graph_layout_algorithm(nodes, links) {
    // 算法开始时间
    d = new Date()
    begin = d.getTime()

    //这是一个随机布局，请在这一部分实现图布局算法
    /*
    for (i in nodes) {
        for (k = 0; k < 10000; k++) {
            nodes[i].x = Math.random() * 0.8 * width + 0.1 * width;
            nodes[i].y = Math.random() * 0.8 * height + 0.1 * height;
        }
    }
    */
    modified_FR(nodes,links);
    nodes_backup = nodes;
    links_backup = links;
    // 算法结束时间
    d2 = new Date()
    end = d2.getTime()

}
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
var drag = d3.drag()
        .on('drag', function (e, d) {
            d3.select(this).attr("cx", d.x = e.x ).attr("cy", d.y = e.y );
            d3.selectAll('.linkline')
                .attr("x1", d => nodes_dict[d.source].x)
                .attr("y1", d => nodes_dict[d.source].y)
                .attr("x2", d => nodes_dict[d.target].x)
                .attr("y2", d => nodes_dict[d.target].y);
            d3.selectAll('.forcenodetext')
                .attr("x", d => d.x)
                .attr("y", d => d.y)
        });
function draw_graph() {
    let svg = d3.select('#container')
        .select('svg')
        .attr('width', width)
        .attr('height', height);
    
    let padding = {'left': 0.15*width, 'bottom': 0.1*height, 'top': 0.2*height, 'right': 0.25*width};
    // title
    svg.append('g')
        .attr('transform', `translate(${padding.left+(width-padding.left-padding.right)/2*1.2}, ${padding.top*0.4})`)
        .append('text')
        .attr('class', 'title')
        .text('A Visualization for Faculties That Research on Computer Science in Well-known Universities');
    
    
    let x = d3.scaleLinear()
        .domain(get_min_max(data1, x_attr))
        .range([padding.left, width-padding.right]);    
    let axis_x = d3.axisBottom()
        .scale(x)
        .ticks(10)
        .tickFormat(d => d);

    // y axis - publications
    let y = d3.scaleLinear()
        .domain(get_min_max(data1, y_attr))
        .range([height-padding.bottom, padding.top]);    
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
        .attr('transform', `translate(${padding.left+(width-padding.left-padding.right)/2}, ${height-padding.bottom})`)
        .append('text')
        .attr('class', 'axis_label')
        .attr('dx', '-0.4rem')
        .attr('dy', 0.08*height)
        .text(x_attr);

    // y axis
    svg.append('g')        
        .attr('transform', `translate(${padding.left}, ${0})`)
        .call(axis_y)
        .attr('font-family', fontFamily)
        .attr('font-size', '0.6rem')
    svg.append('g')
        .attr('transform', `
            translate(${padding.left}, ${height/2})
            rotate(-90)    
        `)
        .append('text')
        .attr('class', 'axis_label')
        .attr('dy', -height*0.07)
        .text(y_attr);

    // points
    var radi = d3.scaleLinear().domain(get_min_max(data1, rad_attr)).range([1.5,10]);

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
            //return compute(lnr(d[col_attr]));
        })
        
        .on('click', (e, d) => {

            //console.log('e', e, 'd', d)

            // show a tooltip
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
                //.transition().duration(500)
                .style('visibility', 'visible');
        })
    show_ins();
    // 数据格式
    // nodes = [{"id": 学校名称, "weight": 毕业学生数量}, ...]
    // links = [{"source": 毕业学校, "target": 任职学校, "weight": 人数}, ...]
    let links = data2.links;
    let nodes = data2.nodes;
    //len(nodes)=256 len(links)=846
    //console.log(links.length, nodes.length)
    // 图布局算法
    if(force_direct_flag==0) graph_layout_algorithm(nodes, links);

    let haslinks = []
    for(let i in nodes){
        haslinks[i]=[];
        for(let j in nodes)
            haslinks[i][j]=0;
    }
    for(let i in links){
        haslinks[links[i].from][links[i].to] = 1;
        haslinks[links[i].to][links[i].from] = 1;
    }
    for (i in nodes) {
        nodes_dict[nodes[i].id] = nodes[i]
    }

    for(i in nodes){
        nodes[i].rawcolor=getc(nodes[i].weight);
        let compute = d3.interpolate(bgcolor,nodes[i].rawcolor);
        nodes[i].fcolor=compute(0.2);
    }

    let clicking = false;

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
        .attr("r", d => Math.sqrt(d.weight) * 2 + 0.5)
        .attr("fill", d=>d.rawcolor)
        .on("mouseover", function (e, d) {// 鼠标移动到node上时显示text
            if(!clicking){
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
        })
        .on("mouseout", function (e, d) {// 鼠标移出node后按条件判断是否显示text
            if(!clicking){
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
        })
        .on("click", function (e, d){
            clicking = true;
            d3.selectAll(".forcepoint").attr("fill", (d2) =>{
                if(d==d2||haslinks[name2id[d.id]][name2id[d2.id]]) return d2.rawcolor;
                else return d2.fcolor;
            });
            d3.selectAll(".linkline").style("visibility", (d2)=>{
                if(d2.source == d.id || d2.target == d.id) return "visible";
                else return "hidden";
            });
            text
                .attr("display", function(f){
                    if((f.id==d.id||haslinks[name2id[d.id]][name2id[f.id]])&&f.weight>5) return "null";
                    else return "none";
                })
        })
        .on("dblclick", function(e,d){
            clicking = false;
            d3.selectAll(".forcepoint").attr("fill", d=>d.rawcolor);
            d3.selectAll(".linkline").style("visibility", "visible");
            text
                .attr("display", function (f) {
                    if (f.weight > 40) {
                        return 'null';
                    }
                    else {
                        return 'none';
                    }
                })
        })
        .call(drag);

    // 学校名称text，只显示满足条件的学校
    let text = svg.append("g")
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
    link
        .attr("x1", d => nodes_dict[d.source].x)
        .attr("y1", d => nodes_dict[d.source].y)
        .attr("x2", d => nodes_dict[d.target].x)
        .attr("y2", d => nodes_dict[d.target].y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    text
        .attr("x", d => d.x)
        .attr("y", d => d.y)

}
function redraw(){
    d3.selectAll('svg > *').remove();
    draw_graph();
}

function slidechangerep(){
    force_direct_flag=0;
    v = document.getElementById('repr').value;
    lambda1 = raw_l1 * v;
    document.getElementById("bartext1").innerText="repulsive coefficient: " + v;

    d3.selectAll('svg > *').remove();
    draw_graph();
}

function slidechangeatt(){
    force_direct_flag=0;
    v = document.getElementById('attr').value;
    lambda2 = raw_l2 * v;
    document.getElementById("bartext2").innerText="attractive coefficient: " + v;

    d3.selectAll('svg > *').remove();
    draw_graph();
}

function slidechangeite(){
    force_direct_flag=0;
    v = document.getElementById('iter').value;
    iters = v;
    console.log(document.getElementById("bartext3").innerText)
    document.getElementById("bartext3").innerText="iterations: " + v;

    d3.selectAll('svg > *').remove();
    draw_graph();
}

function changey() {
    force_direct_flag=1;
    d3.selectAll('svg > *').remove();
    data1 = backup1.filter((d, i) => (d[x_attr] != '' && d[y_attr] != '' && d[rad_attr] != ''));
    y_attr = document.getElementById('y_ax').value;
    draw_graph();
    show_ins();
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
    'Hong Kong University of Science and Technology',
    'Chinese University of Hong Kong',
    'Shanghai Jiao Tong University',
    'Zhejiang University',
    'Nanjing University',
    'Fudan University'
];

var colscatter1 = d3.rgb(254,67,101);
var colscatter2 = d3.rgb(131,175,155);

function show_ins(){
    let ins = document.getElementById("Insnms").value;

    let ins2 = document.getElementById("Insnms2").value;
    if(ins == 'All'){
        d3.selectAll('.scatterpoint').style("visibility", "visible").style('fill',colscatter1);
    }
    else{
        d3.selectAll('.scatterpoint').style("visibility", (d)=>{
            return d["Institution"] == ins || d["Institution"] == ins2 ? "visible" : "hidden";
        }).style('fill', (d)=>{
            return d["Institution"] == ins ? colscatter1 : colscatter2;
        });
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
            draw_graph();
        })
    })
}

main()
