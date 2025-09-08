module.exports = {
  parameters: {
    idParam: {
      name: 'id',
      in: 'path',
      required: true,
      schema: {
        type: 'string'
      },
      description: 'Unique identifier'
    },
    pageParam: {
      name: 'page',
      in: 'query',
      required: false,
      schema: {
        type: 'integer',
        minimum: 1,
        default: 1
      },
      description: 'Page number for pagination'
    },
    limitParam: {
      name: 'limit',
      in: 'query',
      required: false,
      schema: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 10
      },
      description: 'Number of items per page'
    },
    searchParam: {
      name: 'search',
      in: 'query',
      required: false,
      schema: {
        type: 'string'
      },
      description: 'Search query string'
    }
  }
};