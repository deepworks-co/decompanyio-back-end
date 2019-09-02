sls create function -f qraphql --handler src/qraphql/graphql --httpEvent "get /api/graphql"

sls create function -f graphqlPrivate --handler src/qraphql/private --httpEvent "get /api/private"