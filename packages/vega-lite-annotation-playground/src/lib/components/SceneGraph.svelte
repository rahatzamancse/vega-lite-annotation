<script lang="ts">
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as vega from 'vega';

    // Define a custom interface for our D3 node type
    interface CustomNode {
        data: any;
        children?: CustomNode[];
        _children?: CustomNode[];
        x?: number;
        y?: number;
        x0?: number;
        y0?: number;
        id?: string | number;
        depth?: number;
        parent?: CustomNode;
    }
    
    // Scene graph data passed as a prop
    const { sceneGraph }: { sceneGraph: vega.Scene } = $props();

    let container: HTMLElement;
    
    onMount(() => {
        if (sceneGraph && container) {
            renderSceneGraph(sceneGraph);
        }
    });
    
    // Watch for changes in the scene graph
    $effect(() => {
        if (container && sceneGraph) {
            renderSceneGraph(sceneGraph);
        }
    });

    const renderSceneGraph = (sceneGraph: vega.Scene) => {
    
        console.log('[SceneGraph] renderSceneGraph', sceneGraph);
        try {
            // Clear previous content
            container.innerHTML = '';
            
            // Set up dimensions and margins
            const margin = {top: 40, right: 90, bottom: 30, left: 90};
            
            // Get container dimensions or use fixed fallback dimensions if they're zero
            const containerWidth = container.clientWidth || 800;
            const containerHeight = container.clientHeight || 500;
            
            const width = Math.max(containerWidth - margin.left - margin.right, 300);
            const height = Math.max(containerHeight - margin.top - margin.bottom, 300);
            
            // Create the SVG with explicit dimensions
            const svg = d3.select(container)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            
            // Convert the scene graph to a hierarchical structure and cast to our custom type
            const root = d3.hierarchy(sceneGraph as any) as any as CustomNode;
            
            // Set up the tree layout
            const treeLayout = d3.tree<any>().size([height, width]);
            
            // Add a label for the visualization
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", -20)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .text("Vega Scene Graph");
            
            // Function to update the tree visualization
            const update = (source: CustomNode) => {
                // Compute the new tree layout
                const rootWithLayout = treeLayout(root as any) as any;
                const nodes = rootWithLayout.descendants() as CustomNode[];
                const links = rootWithLayout.links();
                
                console.log('[SceneGraph] nodes', nodes);
                console.log('[SceneGraph] links', links);
                
                // Normalize for fixed-depth
                nodes.forEach(d => {
                    d.y = d.depth! * 180; // Horizontal spacing between levels
                });
                
                // Update the nodes
                const node = svg.selectAll<SVGGElement, CustomNode>(".node")
                    .data(nodes, (d: any) => d.id || (d.id = ++nodeId));
                
                // Enter new nodes at the parent's previous position
                const nodeEnter = node.enter().append("g")
                    .attr("class", (d: any) => "node" + (d.children || d._children ? " node--internal" : " node--leaf"))
                    .attr("transform", (d: any) => `translate(${source.y0 || source.y},${source.x0 || source.x})`)
                    .on("click", function(event: any, d: any) {
                        // Toggle children on click
                        if (d.children) {
                            d._children = d.children;
                            d.children = undefined;
                        } else if (d._children) {
                            d.children = d._children;
                            d._children = null;
                        }
                        update(d); // Update the tree
                    });
                    
                // Add circles to the node
                nodeEnter.append("circle")
                    .attr("r", 6)
                    .style("fill", (d: any) => d._children ? "#ffa500" : (d.children ? "#555" : "#999"))
                    .attr("stroke", "#fff")
                    .attr("stroke-width", "2px");
                
                // Add labels to the nodes
                nodeEnter.append("text")
                    .attr("dy", ".35em")
                    .attr("x", (d: any) => d.children || d._children ? -13 : 13)
                    .attr("text-anchor", (d: any) => d.children || d._children ? "end" : "start")
                    .text((d: any) => {
                        const data = d.data;
                        return data.marktype || data.role || (data.name || "group");
                    })
                    .style("fill-opacity", 1);
                
                // Add tooltips with more information
                nodeEnter.append("title")
                    .text((d: any) => {
                        const data = d.data;
                        if (!data) return "No data";
                        
                        // Create a readable representation of the node data
                        const props = Object.keys(data).filter(key => 
                            typeof data[key] !== 'object' && 
                            key !== 'items' && 
                            key !== 'parent' &&
                            data[key] !== undefined
                        );
                        
                        return props.map(key => `${key}: ${data[key]}`).join('\n');
                    });
                
                // Update the position of existing nodes
                const nodeUpdate = nodeEnter.merge(node as any);
                
                nodeUpdate.transition()
                    .duration(750)
                    .attr("transform", (d: any) => `translate(${d.y},${d.x})`);
                
                // Update node attributes and style for existing nodes
                nodeUpdate.select("circle")
                    .attr("r", 6)
                    .style("fill", (d: any) => d._children ? "#ffa500" : (d.children ? "#555" : "#999"));
                    
                // Remove any exiting nodes
                const nodeExit = node.exit().transition()
                    .duration(750)
                    .attr("transform", (d: any) => `translate(${source.y},${source.x})`)
                    .remove();
                    
                nodeExit.select("circle")
                    .attr("r", 0);
                    
                nodeExit.select("text")
                    .style("fill-opacity", 0);
                    
                // Update the links
                const link = svg.selectAll<SVGPathElement, any>(".link")
                    .data(links, (d: any) => d.target.id);
                    
                // Enter any new links at the parent's previous position
                const linkEnter = link.enter().insert("path", "g")
                    .attr("class", "link")
                    .attr("d", (d: any) => {
                        const o = {x: source.x0 || source.x, y: source.y0 || source.y};
                        return diagonal({source: o, target: o});
                    });
                    
                // Update position for existing links
                linkEnter.merge(link as any).transition()
                    .duration(750)
                    .attr("d", diagonal);
                    
                // Remove any exiting links
                link.exit().transition()
                    .duration(750)
                    .attr("d", (d: any) => {
                        const o = {x: source.x, y: source.y};
                        return diagonal({source: o, target: o});
                    })
                    .remove();
                    
                // Store the old positions for transition
                nodes.forEach((d: any) => {
                    d.x0 = d.x;
                    d.y0 = d.y;
                });
            };
            
            // Collapse node function
            const collapse = (d: any) => {
                if (d.children) {
                    d._children = d.children;
                    d._children.forEach(collapse);
                    d.children = undefined;
                }
            };
            
            // Initialize a counter for assigning IDs to nodes
            let nodeId = 0;
            
            // Helper function to draw diagonal links
            const diagonal = (d: any) => {
                return d3.linkHorizontal<any, any>()
                    .x(d => d.y)
                    .y(d => d.x)
                    (d);
            };
            
            // Assign initial positions
            root.x0 = height / 2;
            root.y0 = 0;
            
            // Collapse all nodes except the root initially
            if (root.children) {
                root.children.forEach(collapse);
            }
            
            // Start with the root node to update the visualization
            update(root);
            
            // Add legend for node types
            const legend = svg.append("g")
                .attr("transform", `translate(${width - 150}, -30)`);
                
            // Internal node
            legend.append("circle")
                .attr("r", 6)
                .attr("cx", 0)
                .attr("cy", 0)
                .style("fill", "#555");
                
            legend.append("text")
                .attr("x", 15)
                .attr("y", 5)
                .text("Parent node")
                .style("font-size", "12px");
                
            // Collapsed node
            legend.append("circle")
                .attr("r", 6)
                .attr("cx", 0)
                .attr("cy", 20)
                .style("fill", "#ffa500");
                
            legend.append("text")
                .attr("x", 15)
                .attr("y", 25)
                .text("Collapsed node")
                .style("font-size", "12px");
                
            // Leaf node
            legend.append("circle")
                .attr("r", 6)
                .attr("cx", 0)
                .attr("cy", 40)
                .style("fill", "#999");
                
            legend.append("text")
                .attr("x", 15)
                .attr("y", 45)
                .text("Leaf node")
                .style("font-size", "12px");
            
            // Add info text
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", -5)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .style("fill", "#666")
                .text("Click on nodes to expand/collapse");
        } catch (error: any) {
            console.error('[SceneGraph] Error rendering scene graph:', error);
            container.innerHTML = `<div class="error-message">Error rendering scene graph: ${error.message}</div>`;
        }
    };
</script>

<div class="scene-graph-container" bind:this={container}>
    {#if !sceneGraph}
        <p>No scene graph data available</p>
    {/if}
</div>

<style>
    .scene-graph-container {
        height: 100%;
        width: 100%;
        overflow: auto;
        display: block;
        position: relative;
        box-sizing: border-box;
        min-height: 400px; /* Ensure a minimum height */
    }

    :global(.scene-graph-container svg) {
        display: block;
        margin: 0 auto;
        background-color: #fafafa;
        border: 1px solid #eee;
        border-radius: 4px;
    }

    :global(.node circle) {
        fill: #999;
        stroke: #fff;
        stroke-width: 2px;
    }

    :global(.node--internal circle) {
        fill: #555;
    }

    :global(.node text) {
        font: 12px sans-serif;
    }

    :global(.link) {
        fill: none;
        stroke: #ccc;
        stroke-width: 2px;
    }
</style> 