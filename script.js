// Global variables
let datasets = [];
let currentView = 'both';
let autoRefreshEnabled = true;
let countdownInterval;
let countdownValue = 10;

// Set up dimensions and margins
const margin = { top: 40, right: 30, bottom: 60, left: 60 };
const width = 500 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
const pieRadius = Math.min(width, height) / 2;

// DOM elements
const tooltip = d3.select('#tooltip');

// Color scales
const barColors = ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949'];
const pieColors = ['#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'];

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
  // Set up event listeners
  document.getElementById('viewBoth').addEventListener('click', () => switchView('both'));
  document.getElementById('viewBar').addEventListener('click', () => switchView('bar'));
  document.getElementById('viewPie').addEventListener('click', () => switchView('pie'));
  document.getElementById('refreshData').addEventListener('click', refreshData);
  
  // Auto-refresh toggle
  const autoRefreshCheckbox = document.getElementById('autoRefresh');
  autoRefreshCheckbox.addEventListener('change', function() {
    autoRefreshEnabled = this.checked;
    if (autoRefreshEnabled) {
      startCountdown();
    } else {
      stopCountdown();
    }
  });
  
  // Generate initial data
  generateData();
  
  // Start auto-refresh countdown
  startCountdown();
});

// Generate random dynamic data
function generateData() {
  const timestamp = new Date().toLocaleTimeString();
  
  // Clear previous datasets
  datasets = [];
  
  // Generate quarterly sales data (dynamic)
  const salesData = {
    name: "Quarterly Sales",
    timestamp: timestamp,
    items: []
  };
  
  const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
  quarters.forEach((quarter, i) => {
    // Generate random value between 30000 and 80000
    const value = Math.floor(Math.random() * 50000) + 30000;
    salesData.items.push({
      label: quarter,
      value: value,
      color: barColors[i % barColors.length]
    });
  });
  
  // Generate market share data (dynamic)
  const marketData = {
    name: "Market Share",
    timestamp: timestamp,
    items: []
  };
  
  const products = ['BMW', 'AUDI', 'Mercedes', 'Others'];
  
  // Generate random percentages that sum to 100
  const percentages = generateRandomPercentages(products.length);
  
  products.forEach((product, i) => {
    marketData.items.push({
      label: product,
      value: percentages[i],
      color: pieColors[i % pieColors.length]
    });
  });
  
  // Add datasets
  datasets.push(salesData);
  datasets.push(marketData);
  
  // Create charts
  createBarChart(datasets[0]);
  createPieChart(datasets[1]);
  
  // Update view
  switchView(currentView);
}

// Generate random percentages that sum to 100
function generateRandomPercentages(count) {
  const values = [];
  let remaining = 100;
  
  for (let i = 0; i < count - 1; i++) {
    // Generate a random percentage of what's left
    const max = remaining - (count - i - 1); // Ensure each item gets at least 1%
    const value = Math.floor(Math.random() * (max - 5)) + 5; // Min 5%
    values.push(value);
    remaining -= value;
  }
  
  // Add the remaining percentage to the last item
  values.push(remaining);
  
  return values;
}

// Create bar chart using D3.js
function createBarChart(dataset) {
  // Update title and timestamp
  d3.select('#barChartTitle').text(dataset.name);
  d3.select('#barChartTimestamp').text(`Last updated: ${dataset.timestamp}`);
  
  // Clear previous chart
  d3.select('#barChart').html('');
  
  // Create SVG element
  const svg = d3.select('#barChart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
    
  // X scale
  const x = d3.scaleBand()
    .domain(dataset.items.map(d => d.label))
    .range([0, width])
    .padding(0.2);
    
  // Y scale
  const y = d3.scaleLinear()
    .domain([0, d3.max(dataset.items, d => d.value) * 1.1]) // Add 10% space at top
    .range([height, 0]);
    
  // Add X axis
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('text-anchor', 'middle');
    
  // Add Y axis
  svg.append('g')
    .call(d3.axisLeft(y)
      .ticks(5)
      .tickFormat(d => d3.format(",")(d)));
      
  // Add Y axis label
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left + 20)
    .attr('x', -height / 2)
    .attr('text-anchor', 'middle')
    .text('Value ($)');
    
  // Create bars with animation
  svg.selectAll('.bar')
    .data(dataset.items)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.label))
    .attr('width', x.bandwidth())
    .attr('y', height) // Start at bottom for animation
    .attr('height', 0) // Start with height 0 for animation
    .attr('fill', d => d.color)
    .attr('data-label', d => d.label)
    .attr('data-value', d => d.value)
    // Animation
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attr('y', d => y(d.value))
    .attr('height', d => height - y(d.value));
    
  // Add value labels
  svg.selectAll('.value-label')
    .data(dataset.items)
    .enter()
    .append('text')
    .attr('class', 'value-label')
    .attr('x', d => x(d.label) + x.bandwidth() / 2)
    .attr('y', d => y(d.value) - 5)
    .attr('text-anchor', 'middle')
    .text(d => d3.format("$,")(d.value))
    .style('opacity', 0) // Start invisible for animation
    .transition()
    .duration(800)
    .delay((d, i) => i * 100 + 400) // Delay labels to appear after bars
    .style('opacity', 1);
    
  // Add grid lines for better readability
  svg.selectAll('grid-line')
    .data(y.ticks(5))
    .enter()
    .append('line')
    .attr('class', 'grid-line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d))
    .attr('stroke', '#e0e0e0')
    .attr('stroke-dasharray', '3,3');
    
  // Add interactivity
  addBarChartInteractivity();
}

// Create pie chart using D3.js
function createPieChart(dataset) {
  // Update title and timestamp
  d3.select('#pieChartTitle').text(dataset.name);
  d3.select('#pieChartTimestamp').text(`Last updated: ${dataset.timestamp}`);
  
  // Clear previous chart
  d3.select('#pieChart').html('');
  
  // Create SVG element
  const svg = d3.select('#pieChart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${width / 2 + margin.left},${height / 2 + margin.top})`);
    
  // Create pie layout
  const pie = d3.pie()
    .value(d => d.value)
    .sort(null); // Don't sort, use order from data
    
  // Create arc generator
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(pieRadius);
    
  // Create arcs for hover effect
  const arcHover = d3.arc()
    .innerRadius(0)
    .outerRadius(pieRadius * 1.1);
    
  // Create pie chart slices
  const slices = svg.selectAll('.arc')
    .data(pie(dataset.items))
    .enter()
    .append('g')
    .attr('class', 'arc');
    
  // Add paths with transition
  slices.append('path')
    .attr('d', d => arc({ ...d, startAngle: d.startAngle, endAngle: d.startAngle })) // Start all at 0 angle
    .attr('fill', d => d.data.color)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .attr('data-label', d => d.data.label)
    .attr('data-value', d => d.data.value)
    .attr('data-percent', d => `${Math.round((d.endAngle - d.startAngle) / (2 * Math.PI) * 100)}%`)
    // Animation - grow from center
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attrTween('d', function(d) {
      const interpolate = d3.interpolate(
        { startAngle: d.startAngle, endAngle: d.startAngle },
        { startAngle: d.startAngle, endAngle: d.endAngle }
      );
      return function(t) {
        return arc(interpolate(t));
      };
    });
    
  // Add percentage labels inside pie slices
  slices.append('text')
    .attr('transform', d => `translate(${arc.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .style('fill', '#fff')
    .text(d => `${d.data.value}%`)
    .style('opacity', 0)
    .transition()
    .duration(400)
    .delay((d, i) => i * 100 + 600)
    .style('opacity', 1);
    
  // Create legend
  const legend = svg.selectAll('.legend')
    .data(dataset.items)
    .enter()
    .append('g')
    .attr('class', 'legend')
    .attr('transform', (d, i) => `translate(${pieRadius + 20},${-pieRadius + (i * 25)})`);
    
  // Add color squares
  legend.append('rect')
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', d => d.color)
    .style('opacity', 0)
    .transition()
    .duration(400)
    .delay((d, i) => i * 100 + 800)
    .style('opacity', 1);
    
  // Add labels
  legend.append('text')
    .attr('x', 20)
    .attr('y', 12)
    .text(d => `${d.label} (${d.value}%)`)
    .style('opacity', 0)
    .transition()
    .duration(400)
    .delay((d, i) => i * 100 + 800)
    .style('opacity', 1);
    
  // Add interactivity
  addPieChartInteractivity();
}

// Add interactivity to bar chart
function addBarChartInteractivity() {
  d3.selectAll('#barChart rect.bar')
    .on('mouseover', function(event, d) {
      // Highlight bar
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 0.8);
        
      // Show tooltip
      const label = this.getAttribute('data-label');
      const value = this.getAttribute('data-value');
      
      tooltip.select('.tooltip-content')
        .html(`<strong>${label}</strong>: ${d3.format("$,")(value)}`);
        
      tooltip.style('display', 'block')
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 30}px`);
    })
    .on('mousemove', function(event) {
      tooltip.style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 30}px`);
    })
    .on('mouseout', function() {
      // Reset highlight
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 1);
        
      // Hide tooltip
      tooltip.style('display', 'none');
    })
    .on('click', function() {
      // Click animation
      const bar = d3.select(this);
      const originalY = parseFloat(bar.attr('y'));
      const originalHeight = parseFloat(bar.attr('height'));
      
      bar.transition()
        .duration(100)
        .attr('y', originalY - 10)
        .attr('height', originalHeight + 10)
        .transition()
        .duration(100)
        .attr('y', originalY)
        .attr('height', originalHeight);
    });
}

// Add interactivity to pie chart
function addPieChartInteractivity() {
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(pieRadius);
    
  const arcHover = d3.arc()
    .innerRadius(0)
    .outerRadius(pieRadius * 1.1);
    
  d3.selectAll('#pieChart .arc path')
    .on('mouseover', function(event, d) {
      // Expand slice
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', d => arcHover(d));
        
      // Show tooltip
      const label = this.getAttribute('data-label');
      const value = this.getAttribute('data-value');
      const percent = this.getAttribute('data-percent');
      
      tooltip.select('.tooltip-content')
        .html(`<strong>${label}</strong>: ${value}% (${percent})`);
        
      tooltip.style('display', 'block')
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 30}px`);
    })
    .on('mousemove', function(event) {
      tooltip.style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 30}px`);
    })
    .on('mouseout', function(event, d) {
      // Return to normal size
      d3.select(this)
        .transition()
        .duration(200)
        .attr('d', d => arc(d));
        
      // Hide tooltip
      tooltip.style('display', 'none');
    })
    .on('click', function(event, d) {
      // Pulse animation
      const slice = d3.select(this);
      
      slice.transition()
        .duration(100)
        .attr('d', d => {
          const largerArc = d3.arc()
            .innerRadius(0)
            .outerRadius(pieRadius * 1.15);
          return largerArc(d);
        })
        .transition()
        .duration(100)
        .attr('d', d => arc(d));
    });
}

// Switch between different views
function switchView(view) {
  currentView = view;
  
  // Update active button
  document.querySelectorAll('.view-controls button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`view${view.charAt(0).toUpperCase() + view.slice(1)}`).classList.add('active');
  
  // Update chart visibility
  const barContainer = document.getElementById('barChartContainer');
  const pieContainer = document.getElementById('pieChartContainer');
  
  switch(view) {
    case 'both':
      barContainer.style.display = 'block';
      pieContainer.style.display = 'block';
      break;
    case 'bar':
      barContainer.style.display = 'block';
      pieContainer.style.display = 'none';
      break;
    case 'pie':
      barContainer.style.display = 'none';
      pieContainer.style.display = 'block';
      break;
  }
}

// Refresh data with animation
function refreshData() {
  // Reset countdown
  countdownValue = 10;
  document.getElementById('countdown').textContent = countdownValue;
  
  // Add transition effect
  d3.select('.charts-container')
    .style('opacity', 1)
    .transition()
    .duration(300)
    .style('opacity', 0.3)
    .on('end', function() {
      // Generate new data
      generateData();
      // Fade back in
      d3.select(this)
        .transition()
        .duration(300)
        .style('opacity', 1);
    });
}

// Start countdown for auto-refresh
function startCountdown() {
  // Clear existing interval if any
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  // Reset countdown value
  countdownValue = 10;
  document.getElementById('countdown').textContent = countdownValue;
  
  // Set up new interval
  countdownInterval = setInterval(function() {
    countdownValue--;
    document.getElementById('countdown').textContent = countdownValue;
    
    // When countdown reaches 0, refresh data
    if (countdownValue <= 0) {
      refreshData();
    }
  }, 1000);
}

// Stop countdown
function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}