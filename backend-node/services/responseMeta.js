function nowIso() {
    return new Date().toISOString();
}

function buildMetadata({ source = 'json', fallbackReason = null, filters = null, quality = null } = {}) {
    const metadata = {
        source,
        updatedAt: nowIso()
    };

    if (fallbackReason) metadata.fallbackReason = fallbackReason;
    if (filters) metadata.filters = filters;
    if (quality) metadata.quality = quality;

    return metadata;
}

function withMetadata(payload, options = {}) {
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        return {
            ...payload,
            metadata: {
                ...(payload.metadata || {}),
                ...buildMetadata(options)
            }
        };
    }

    return {
        items: Array.isArray(payload) ? payload : [],
        metadata: buildMetadata(options)
    };
}

function countRecords(datasets = {}) {
    return Object.fromEntries(
        Object.entries(datasets).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
    );
}

function assessDataQuality(datasets = {}) {
    const recordCounts = countRecords(datasets);
    const emptyEntities = Object.entries(recordCounts)
        .filter(([, count]) => count === 0)
        .map(([key]) => key);

    return {
        recordCounts,
        emptyEntities,
        status: emptyEntities.length ? 'partial' : 'complete'
    };
}

module.exports = {
    buildMetadata,
    withMetadata,
    assessDataQuality,
    countRecords
};
