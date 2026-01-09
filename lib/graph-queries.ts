export const TREE_DATA_QUERY = `
  MATCH (s:Scan)
  WHERE s.scanned_by = $userName OR s.scanned_by = 'System'
  MATCH (s)-[:INCLUDES_PACKAGE]->(p:Package)
  OPTIONAL MATCH (r:Repository)-[:HAS_SCAN]->(s)
  OPTIONAL MATCH (s)-[:DETECTED]->(v:Vulnerability)
  WHERE v.affected_packages CONTAINS p.name OR ANY(pkg IN v.affected_packages WHERE pkg = p.name)
  RETURN COALESCE(r.name, "Unknown Repo") as repo, p.name as package, v.severity as severity, v.id as vuln_id
  LIMIT 2000
`;

export const KNOWLEDGE_GRAPH_QUERY = `
  MATCH (s:Scan {scanned_by: $userName})-[r1]-(n)
  RETURN s as n, r1 as r, n as m
  UNION
  MATCH (s:Scan {scanned_by: $userName})-[r1]-(n)-[r2]-(o)
  RETURN n, r2 as r, o as m
  LIMIT 2000
`;

export const KNOWLEDGE_GRAPH_DEFAULT_QUERY = `
  MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 2000
`;

export const COMPARE_REPOS_QUERY = `
  MATCH (r:Repository)
  WHERE r.name IN $repoNames
  MATCH (r)-[:HAS_SCAN]->(s:Scan)-[:INCLUDES_PACKAGE]->(p:Package)
  OPTIONAL MATCH (s)-[:DETECTED]->(v:Vulnerability)
  WHERE v.affected_packages CONTAINS p.name OR ANY(pkg IN v.affected_packages WHERE pkg = p.name)
  RETURN r.name as repo, p.name as package, v.severity as severity, v.id as vuln_id
`;

// Tree data query filtered by specific scan IDs (for version selection)
export const TREE_DATA_BY_SCANS = `
  MATCH (s:Scan)
  WHERE s.id IN $scanIds
  MATCH (s)-[:INCLUDES_PACKAGE]->(p:Package)
  OPTIONAL MATCH (repo:Repository)-[:HAS_SCAN]->(s)
  OPTIONAL MATCH (s)-[:DETECTED]->(v:Vulnerability)
  WHERE v.affected_packages CONTAINS p.name OR ANY(pkg IN v.affected_packages WHERE pkg = p.name)
  RETURN COALESCE(repo.name, 'Unknown') as repo, p.name as package, v.severity as severity, v.id as vuln_id
`;

export const KNOWLEDGE_GRAPH_REPO_QUERY = `
  MATCH (r:Repository)
  WHERE r.name IN $repoNames
  MATCH (r)-[r1:HAS_SCAN]->(s:Scan)
  RETURN r as n, r1 as r, s as m
  UNION
  MATCH (r:Repository)
  WHERE r.name IN $repoNames
  MATCH (r)-[:HAS_SCAN]->(s:Scan)-[r2:INCLUDES_PACKAGE]->(p:Package)
  RETURN s as n, r2 as r, p as m
  UNION
  MATCH (r:Repository)
  WHERE r.name IN $repoNames
  MATCH (r)-[:HAS_SCAN]->(s:Scan)-[r3:DETECTED]->(v:Vulnerability)
  RETURN s as n, r3 as r, v as m
  LIMIT 2000
`;

// Query for KnowledgeGraph filtered by specific scan IDs (for version selection)
export const KNOWLEDGE_GRAPH_BY_SCANS = `
  MATCH (s:Scan)
  WHERE s.id IN $scanIds
  MATCH (r:Repository)-[r1:HAS_SCAN]->(s)
  RETURN r as n, r1 as r, s as m
  UNION
  MATCH (s:Scan)
  WHERE s.id IN $scanIds
  MATCH (s)-[r2:INCLUDES_PACKAGE]->(p:Package)
  RETURN s as n, r2 as r, p as m
  UNION
  MATCH (s:Scan)
  WHERE s.id IN $scanIds
  MATCH (s)-[r3:DETECTED]->(v:Vulnerability)
  RETURN s as n, r3 as r, v as m
  LIMIT 2000
`;

export const HEATMAP_QUERY_REPOS = `
  MATCH (r:Repository)-[:HAS_SCAN]->(s:Scan)-[:INCLUDES_PACKAGE]->(p:Package)
  WHERE r.name IN $repoNames
  OPTIONAL MATCH (s)-[:DETECTED]->(v:Vulnerability)
  WHERE v IS NOT NULL AND (v.affected_packages CONTAINS p.name OR ANY(pkg IN v.affected_packages WHERE pkg = p.name))
  RETURN r.name as repo, v.id as vulnId, v.severity as severity
  ORDER BY repo, severity
`;

// Query for heatmap with specific scan version - filters by scan ID
export const HEATMAP_QUERY_BY_SCAN = `
  MATCH (s:Scan {id: $scanId})-[:INCLUDES_PACKAGE]->(p:Package)
  OPTIONAL MATCH (repo:Repository)-[:HAS_SCAN]->(s)
  OPTIONAL MATCH (s)-[:DETECTED]->(v:Vulnerability)
  WHERE v IS NOT NULL AND (v.affected_packages CONTAINS p.name OR ANY(pkg IN v.affected_packages WHERE pkg = p.name))
  RETURN COALESCE(repo.name, 'Unknown') as repo, v.id as vulnId, v.severity as severity
  ORDER BY repo, severity
`;

// Query for heatmap with multiple specific scan versions (one per repo)
export const HEATMAP_QUERY_BY_SCANS = `
  MATCH (s:Scan)-[:INCLUDES_PACKAGE]->(p:Package)
  WHERE s.id IN $scanIds
  OPTIONAL MATCH (repo:Repository)-[:HAS_SCAN]->(s)
  OPTIONAL MATCH (s)-[:DETECTED]->(v:Vulnerability)
  WHERE v IS NOT NULL AND (v.affected_packages CONTAINS p.name OR ANY(pkg IN v.affected_packages WHERE pkg = p.name))
  RETURN COALESCE(repo.name, 'Unknown') as repo, s.id as scanId, v.id as vulnId, v.severity as severity
  ORDER BY repo, severity
`;