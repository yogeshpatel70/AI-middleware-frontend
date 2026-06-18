import { useCustomSelector } from "@/customHooks/customSelector";
import { MODAL_TYPE } from "@/utils/enums";
import { closeModal } from "@/utils/utility";
import React, { useMemo } from "react";
import Modal from "../UI/Modal";
import { BotIcon } from "../Icons";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

const ResourceInUseModal = ({ usage, resourceName, orgId }) => {
  const router = useRouter();

  const { bridges } = useCustomSelector((state) => ({
    bridges: state?.bridgeReducer?.org?.[orgId]?.orgs || [],
  }));

  const bridgeMap = useMemo(() => {
    const map = {};
    Object.values(bridges || {}).forEach((b) => {
      if (b?._id) map[b._id] = b;
    });
    return map;
  }, [bridges]);

  const connectedAgents = useMemo(() => {
    if (!usage) return [];
    return Object.entries(usage)
      .map(([bridgeId, versionIds]) => {
        const bridge = bridgeMap[bridgeId];
        const allVersions = bridge?.versions || [];
        const matchingVersions = (versionIds || []).map((vid) => {
          const idx = allVersions.indexOf(vid);
          return { id: vid, versionIndex: idx };
        });
        return {
          bridgeId,
          name: bridge?.name || bridgeId,
          publishedVersionId: bridge?.published_version_id || null,
          versions: matchingVersions,
          knownAgent: Boolean(bridge),
        };
      })
      .filter((a) => a.versions.length > 0);
  }, [usage, bridgeMap]);

  const handleClose = () => closeModal(MODAL_TYPE.RESOURCE_IN_USE_MODAL);

  const goToAgent = (bridgeId, versionId) => {
    handleClose();
    const url = versionId
      ? `/org/${orgId}/agents/configure/${bridgeId}?version=${versionId}`
      : `/org/${orgId}/agents/configure/${bridgeId}`;
    router.push(url);
  };

  return (
    <Modal MODAL_ID={MODAL_TYPE.RESOURCE_IN_USE_MODAL} onClose={handleClose}>
      <div
        id="resource-in-use-modal-container"
        className="modal-box focus:outline-none w-11/12 max-w-5xl max-h-[85vh]"
        tabIndex="-1"
      >
        <h3 className="font-bold text-lg mb-2">Cannot delete resource</h3>
        <p className="text-sm text-base-content/70 mb-4">
          {resourceName ? (
            <>
              The knowledge base <span className="font-semibold">{resourceName}</span> is currently in use by the
              following agents and versions. Remove it from them before deleting.
            </>
          ) : (
            "This knowledge base is currently in use by the following agents and versions."
          )}
        </p>

        {connectedAgents.length > 0 ? (
          <div className="overflow-y-auto max-h-[60vh] pr-1 space-y-3">
            {connectedAgents.map((agent) => {
              const isClickable = agent.knownAgent;
              return (
                <div
                  key={agent.bridgeId}
                  role={isClickable ? "button" : undefined}
                  tabIndex={isClickable ? 0 : -1}
                  onClick={() => isClickable && goToAgent(agent.bridgeId, agent.publishedVersionId)}
                  onKeyDown={(e) => {
                    if (isClickable && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      goToAgent(agent.bridgeId, agent.publishedVersionId);
                    }
                  }}
                  className={`group p-4 border border-base-300 rounded-lg bg-base-100 transition-all ${
                    isClickable ? "cursor-pointer hover:border-primary hover:shadow-md hover:bg-base-200" : "opacity-70"
                  }`}
                  title={isClickable ? "Open agent (published version)" : "Agent not in current org"}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <BotIcon className="text-primary shrink-0" />
                      <h4 className="font-semibold text-base-content truncate group-hover:text-primary">
                        {agent.name}
                      </h4>
                      <span className="text-[10px] font-mono bg-base-200 group-hover:bg-base-300 px-1.5 py-0.5 rounded text-base-content/60">
                        {agent.bridgeId}
                      </span>
                    </div>
                    {isClickable && (
                      <ChevronRight
                        size={18}
                        className="text-base-content/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                      />
                    )}
                  </div>
                  <div className="flex items-start gap-2 text-sm text-base-content/80">
                    <div className="font-medium pt-1 shrink-0">Versions:</div>
                    <div className="flex flex-wrap gap-2">
                      {agent.versions.map((version) => (
                        <button
                          key={version.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToAgent(agent.bridgeId, version.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-mono bg-base-200 hover:bg-primary hover:text-primary-content border border-base-300 hover:border-primary px-2 py-1 rounded-md transition-colors"
                          title={`Open version ${version.id}`}
                        >
                          <span className="font-semibold">
                            {version.versionIndex >= 0 ? `v${version.versionIndex + 1}` : "v?"}
                          </span>
                          <span className="opacity-70">({version.id})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 text-base-content/70 text-sm">No connected agents found.</div>
        )}

        <div className="modal-action">
          <form method="dialog">
            <button className="btn focus:outline-none focus:ring-0" onClick={handleClose}>
              Close
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default ResourceInUseModal;
