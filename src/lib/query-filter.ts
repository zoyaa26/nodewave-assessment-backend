import {
  BuildQueryFilter,
  extractQueryFromParams,
} from "@nodewave/prisma-ezfilter";

const queryBuilder = new BuildQueryFilter({
  maxPageSize: 100,
  defaultPageSize: 10,
});

export function buildQueryFilter(
  params: Record<string, string | string[] | undefined>,
) {
  const filter = extractQueryFromParams(params);

  return queryBuilder.build(filter);
}