/**
 * School-aware query helper.
 * If schoolId is provided, adds `.eq('school_id', schoolId)` to queries.
 */
function filterBySchool(query, schoolId) {
  if (schoolId) {
    return query.eq('school_id', schoolId);
  }
  return query;
}

/**
 * Extract school_id from request (body, query, or authenticated user).
 */
function getSchoolId(req) {
  return req.body?.school_id || req.query?.school_id || req.user?.school_id || null;
}

module.exports = { filterBySchool, getSchoolId };
