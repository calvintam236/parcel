// @flow strict-local

import assert from 'assert';
// import sinon from 'sinon';

// flowlint-next-line untyped-import:off
import Graph from '../src/Graph';

describe('Graph', () => {
  it('constructor should initialize an empty graph', () => {
    let graph = new Graph();
    assert.deepEqual(graph.nodes, new Map());
    assert.deepEqual(graph.getAllEdges(), []);
  });

  it('addNode should add a node to the graph', () => {
    let graph = new Graph();
    let node = {id: 'do not use', type: 'mynode', value: 'a'};
    let id = graph.addNode(node);
    assert.equal(graph.nodes.get(id), node);
  });

  it("errors when removeNode is called with a node that doesn't belong", () => {
    let graph = new Graph();
    assert.throws(() => {
      graph.removeNode('invalid id');
    }, /Does not have node/);
  });

  it('errors when traversing a graph with no root', () => {
    let graph = new Graph();

    assert.throws(() => {
      graph.traverse(() => {});
    }, /A start node is required to traverse/);
  });

  it("errors when traversing a graph with a startNode that doesn't belong", () => {
    let graph = new Graph();

    assert.throws(() => {
      graph.traverse(() => {}, 'dne');
    }, /Does not have node/);
  });

  it("errors if replaceNodeIdsConnectedTo is called with a node that doesn't belong", () => {
    let graph = new Graph();
    assert.throws(() => {
      graph.replaceNodeIdsConnectedTo('invalid id', []);
    }, /Does not have node/);
  });

  it("errors when adding an edge to a node that doesn't exist", () => {
    let graph = new Graph();
    let node = graph.addNode({id: 'foo', type: 'mynode', value: null});
    assert.throws(() => {
      graph.addEdge(node, 'invalid id');
    }, /"to" node 'invalid id' not found/);
  });

  it("errors when adding an edge from a node that doesn't exist", () => {
    let graph = new Graph();
    let node = graph.addNode({id: 'foo', type: 'mynode', value: null});
    assert.throws(() => {
      graph.addEdge('invalid id', node);
    }, /"from" node 'invalid id' not found/);
  });

  it('hasNode should return a boolean based on whether the node exists in the graph', () => {
    let graph = new Graph();
    let node = graph.addNode({id: 'a', type: 'mynode', value: 'a'});
    assert(graph.hasNode(node));
    assert(!graph.hasNode('b'));
  });

  it('addEdge should add an edge to the graph', () => {
    let graph = new Graph();
    let nodeA = graph.addNode({id: 'a', type: 'mynode', value: null});
    let nodeB = graph.addNode({id: 'b', type: 'mynode', value: null});
    graph.addEdge(nodeA, nodeB);
    assert(graph.hasEdge(nodeA, nodeB));
  });

  it('isOrphanedNode should return true or false if the node is orphaned or not', () => {
    let graph = new Graph();
    let nodeA = graph.addNode({id: 'a', type: 'mynode', value: 'a'});
    let nodeB = graph.addNode({id: 'b', type: 'mynode', value: 'b'});
    let nodeC = graph.addNode({id: 'c', type: 'mynode', value: 'c'});
    graph.addEdge(nodeA, nodeB);
    graph.addEdge(nodeA, nodeC, 'edgetype');
    assert(graph._isOrphanedNode(nodeA));
    assert(!graph._isOrphanedNode(nodeB));
    assert(!graph._isOrphanedNode(nodeC));
  });

  it('removeEdge should prune the graph at that edge', () => {
    //         a
    //        / \
    //       b - d
    //      /
    //     c
    let graph = new Graph();
    let nodeA = graph.addNode({id: 'a', type: 'mynode', value: 'a'});
    let nodeB = graph.addNode({id: 'b', type: 'mynode', value: 'b'});
    let nodeC = graph.addNode({id: 'c', type: 'mynode', value: 'c'});
    let nodeD = graph.addNode({id: 'd', type: 'mynode', value: 'd'});
    graph.addEdge(nodeA, nodeB);
    graph.addEdge(nodeA, nodeD);
    graph.addEdge(nodeB, nodeC);
    graph.addEdge(nodeB, nodeD);

    graph.removeEdge(nodeA, nodeB);
    assert(graph.nodes.has(nodeA));
    assert(graph.nodes.has(nodeD));
    assert(!graph.nodes.has(nodeB));
    assert(!graph.nodes.has(nodeC));
    assert.deepEqual(graph.getAllEdges(), [
      {from: nodeA, to: nodeD, type: null},
    ]);
  });

  it('removing a node recursively deletes orphaned nodes', () => {
    // before:
    //       a
    //      / \
    //     b   c
    //    / \    \
    //   d   e    f
    //  /
    // g
    //

    // after:
    //      a
    //       \
    //        c
    //         \
    //          f

    let graph = new Graph();
    let nodeA = graph.addNode({id: 'a', type: 'mynode', value: 'a'});
    let nodeB = graph.addNode({id: 'b', type: 'mynode', value: 'b'});
    let nodeC = graph.addNode({id: 'c', type: 'mynode', value: 'c'});
    let nodeD = graph.addNode({id: 'd', type: 'mynode', value: 'd'});
    let nodeE = graph.addNode({id: 'e', type: 'mynode', value: 'e'});
    let nodeF = graph.addNode({id: 'f', type: 'mynode', value: 'f'});
    let nodeG = graph.addNode({id: 'g', type: 'mynode', value: 'g'});

    graph.addEdge(nodeA, nodeB);
    graph.addEdge(nodeA, nodeC);
    graph.addEdge(nodeB, nodeD);
    graph.addEdge(nodeB, nodeE);
    graph.addEdge(nodeC, nodeF);
    graph.addEdge(nodeD, nodeG);

    graph.removeNode(nodeB);

    assert.deepEqual([...graph.nodes.keys()], [nodeA, nodeC, nodeF]);
    assert.deepEqual(graph.getAllEdges(), [
      {from: nodeA, to: nodeC, type: null},
      {from: nodeC, to: nodeF, type: null},
    ]);
  });

  it('removing a node recursively deletes orphaned nodes if there is no path to the root', () => {
    // before:
    //       a
    //      / \
    //     b   c
    //    / \    \
    // |-d   e    f
    // |/
    // g
    //

    // after:
    //      a
    //       \
    //        c
    //         \
    //          f

    let graph = new Graph();
    let nodeA = graph.addNode({id: 'a', type: 'mynode', value: 'a'});
    let nodeB = graph.addNode({id: 'b', type: 'mynode', value: 'b'});
    let nodeC = graph.addNode({id: 'c', type: 'mynode', value: 'c'});
    let nodeD = graph.addNode({id: 'd', type: 'mynode', value: 'd'});
    let nodeE = graph.addNode({id: 'e', type: 'mynode', value: 'e'});
    let nodeF = graph.addNode({id: 'f', type: 'mynode', value: 'f'});
    let nodeG = graph.addNode({id: 'g', type: 'mynode', value: 'g'});
    graph.rootNodeId = nodeA;

    graph.addEdge(nodeA, nodeB);
    graph.addEdge(nodeA, nodeC);
    graph.addEdge(nodeB, nodeD);
    graph.addEdge(nodeG, nodeD);
    graph.addEdge(nodeB, nodeE);
    graph.addEdge(nodeC, nodeF);
    graph.addEdge(nodeD, nodeG);

    graph.removeNode(nodeB);

    assert.deepEqual([...graph.nodes.keys()], [nodeA, nodeC, nodeF]);
    assert.deepEqual(graph.getAllEdges(), [
      {from: nodeA, to: nodeC, type: null},
      {from: nodeC, to: nodeF, type: null},
    ]);
  });

  it('removing an edge to a node that cycles does not remove it if there is a path to the root', () => {
    //        a
    //        |
    //        b <----
    //       / \    |
    //      c   d   |
    //       \ /    |
    //        e -----
    let graph = new Graph();
    let nodeA = graph.addNode({id: 'a', type: 'mynode', value: 'a'});
    let nodeB = graph.addNode({id: 'b', type: 'mynode', value: 'b'});
    let nodeC = graph.addNode({id: 'c', type: 'mynode', value: 'c'});
    let nodeD = graph.addNode({id: 'd', type: 'mynode', value: 'd'});
    let nodeE = graph.addNode({id: 'e', type: 'mynode', value: 'e'});
    graph.rootNodeId = nodeA;

    graph.addEdge(nodeA, nodeB);
    graph.addEdge(nodeB, nodeC);
    graph.addEdge(nodeB, nodeD);
    graph.addEdge(nodeC, nodeE);
    graph.addEdge(nodeD, nodeE);
    graph.addEdge(nodeE, nodeB);

    const getNodeIds = () => [...graph.nodes.keys()];
    let nodesBefore = getNodeIds();

    graph.removeEdge(nodeC, nodeE);

    assert.deepEqual(nodesBefore, getNodeIds());
    assert.deepEqual(graph.getAllEdges(), [
      {from: nodeA, to: nodeB, type: null},
      {from: nodeB, to: nodeC, type: null},
      {from: nodeB, to: nodeD, type: null},
      {from: nodeD, to: nodeE, type: null},
      {from: nodeE, to: nodeB, type: null},
    ]);
  });

  // NODE ID: Rewrite this test
  // it('removing a node with only one inbound edge does not cause it to be removed as an orphan', () => {
  //   let graph = new Graph();

  //   let nodeA = graph.addNode({id: 'a', type: 'mynode', value: 'a'});
  //   let nodeB = graph.addNode({id: 'b', type: 'mynode', value: 'b'});
  //   graph.rootNodeId = nodeA;

  //   graph.addEdge(nodeA, nodeB);

  //   let spy = sinon.spy(graph, 'removeNode');
  //   try {
  //     graph.removeNode(nodeB);

  //     assert(spy.calledOnceWithExactly({id: 'b', type: 'mynode', value: 'b'}));
  //   } finally {
  //     spy.restore();
  //   }
  // });

  // NODE ID: should replaceNodeIdsConnectedTo
  // it("replaceNodeIdsConnectedTo should update a node's downstream nodes", () => {
  //   let graph = new Graph();
  //   let nodeA = graph.addNode({id: 'a', type: 'mynode', value: 'a'});
  //   let nodeB = graph.addNode({id: 'b', type: 'mynode', value: 'b'});
  //   let nodeC = graph.addNode({id: 'c', type: 'mynode', value: 'c'});
  //   graph.addEdge(nodeA, nodeB);
  //   graph.addEdge(nodeA, nodeC);

  //   let nodeD = {id: 'd', type: 'mynode', value: 'd'};
  //   graph.replaceNodeIdsConnectedTo(nodeA, [nodeB, nodeD]);

  //   assert(graph.nodes.has('a'));
  //   assert(graph.nodes.has('b'));
  //   assert(!graph.nodes.has('c'));
  //   assert(graph.nodes.has('d'));
  //   assert.deepEqual(graph.getAllEdges(), [
  //     {from: 'a', to: 'b', type: null},
  //     {from: 'a', to: 'd', type: null},
  //   ]);
  // });

  it('traverses along edge types if a filter is given', () => {
    let graph = new Graph();
    let nodeA = graph.addNode({id: 'a', type: 'mynode', value: 'a'});
    let nodeB = graph.addNode({id: 'b', type: 'mynode', value: 'b'});
    let nodeC = graph.addNode({id: 'c', type: 'mynode', value: 'c'});
    let nodeD = graph.addNode({id: 'd', type: 'mynode', value: 'd'});

    graph.addEdge(nodeA, nodeB, 'edgetype');
    graph.addEdge(nodeA, nodeD);
    graph.addEdge(nodeB, nodeC);
    graph.addEdge(nodeB, nodeD, 'edgetype');

    graph.rootNodeId = nodeA;

    let visited = [];
    graph.traverse(
      nodeId => {
        visited.push(nodeId);
      },
      null, // use root as startNode
      'edgetype',
    );

    assert.deepEqual(visited, [nodeA, nodeB, nodeD]);
  });
});
