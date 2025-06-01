import useCurrentAddress from "@/lib/sui/hooks/useCurrentAddress"

export default function useUserStatsQuery() {
  const address = useCurrentAddress()

  return useQuery({
    queryKey: ['userStats', address],
    queryFn: address ? () => {
      return {vault_count: 0, entry_count: 0, unique_tags_count: 0}
    } : skipToken,
  })
}
