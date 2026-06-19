import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionHeader } from './SectionHeader.js';
import { describe, it, expect, vi } from 'vitest';
import type { BreadcrumbItem } from '../../../model/calm.js';

describe('SectionHeader', () => {
    it('renders icon, namespace, id, and version', () => {
        const icon = <span data-testid="test-icon">Icon</span>;
        render(
            <SectionHeader
                icon={icon}
                namespace="my-namespace"
                id="my-id"
                version="1.0.0"
            />
        );

        expect(screen.getByTestId('test-icon')).toBeInTheDocument();

        const heading = screen.getByRole('heading');
        expect(heading).toHaveTextContent('my-namespace');
        expect(heading).toHaveTextContent('my-id');
        expect(heading).toHaveTextContent('1.0.0');
    });

    it('shows the display name and type label in place of the id when provided', () => {
        render(
            <SectionHeader
                icon={<span>Icon</span>}
                namespace="my-namespace"
                id="42"
                version="1.0.0"
                showVersion={false}
                typeLabel="Architecture"
                displayName="Trading System"
            />
        );

        const heading = screen.getByRole('heading');
        expect(heading).toHaveTextContent('my-namespace');
        expect(heading).toHaveTextContent('Architecture');
        expect(heading).toHaveTextContent('Trading System');
        // The numeric id is no longer shown as the label (kept as a tooltip).
        expect(heading).not.toHaveTextContent('42');
    });

    it('renders right content when provided', () => {
        const icon = <span>Icon</span>;
        const rightContent = <div data-testid="right-content">Right Content</div>;

        render(
            <SectionHeader
                icon={icon}
                namespace="namespace"
                id="id"
                version="1.0"
                rightContent={rightContent}
            />
        );

        expect(screen.getByTestId('right-content')).toBeInTheDocument();
        expect(screen.getByText('Right Content')).toBeInTheDocument();
    });

    it('renders without right content', () => {
        const icon = <span>Icon</span>;

        render(
            <SectionHeader
                icon={icon}
                namespace="namespace"
                id="id"
                version="1.0"
            />
        );

        const heading = screen.getByRole('heading');
        expect(heading).toHaveTextContent('namespace');
    });

    it('renders slashes with gray styling', () => {
        const icon = <span>Icon</span>;

        const { container } = render(
            <SectionHeader
                icon={icon}
                namespace="namespace"
                id="id"
                version="1.0"
            />
        );

        const graySpans = container.querySelectorAll('.text-gray-400');
        expect(graySpans).toHaveLength(2);
        expect(graySpans[0]).toHaveTextContent('/');
        expect(graySpans[1]).toHaveTextContent('/');
    });

    it('shows share bar defaulting to latest (unversioned) URL when id is a slug', () => {
        const icon = <span>Icon</span>;

        render(
            <SectionHeader
                icon={icon}
                namespace="finos"
                id="api-gateway"
                version="1.0.0"
            />
        );

        const shareBar = screen.getByTestId('share-bar');
        expect(shareBar).toBeInTheDocument();

        const urlInput = screen.getByRole('textbox', { name: 'Shareable URL' });
        expect(urlInput).toBeInTheDocument();
        expect(urlInput).toHaveValue('http://localhost:3000/calm/namespaces/finos/api-gateway');
        expect(urlInput).toHaveAttribute('readOnly');

        expect(screen.getByTitle('Link to latest version')).toBeInTheDocument();
        expect(screen.getByTitle('Link to this specific version')).toBeInTheDocument();
        expect(screen.getByTitle('Copy URL')).toBeInTheDocument();
    });

    it('switches to pinned (versioned) URL when Pinned is clicked', () => {
        const icon = <span>Icon</span>;

        render(
            <SectionHeader
                icon={icon}
                namespace="finos"
                id="api-gateway"
                version="1.0.0"
            />
        );

        fireEvent.click(screen.getByTitle('Link to this specific version'));

        const urlInput = screen.getByRole('textbox', { name: 'Shareable URL' });
        expect(urlInput).toHaveValue('http://localhost:3000/calm/namespaces/finos/api-gateway/versions/1.0.0');
    });

    it('switches back to latest URL when Latest is clicked after Pinned', () => {
        const icon = <span>Icon</span>;

        render(
            <SectionHeader
                icon={icon}
                namespace="finos"
                id="api-gateway"
                version="1.0.0"
            />
        );

        fireEvent.click(screen.getByTitle('Link to this specific version'));
        fireEvent.click(screen.getByTitle('Link to latest version'));

        const urlInput = screen.getByRole('textbox', { name: 'Shareable URL' });
        expect(urlInput).toHaveValue('http://localhost:3000/calm/namespaces/finos/api-gateway');
    });

    it('does not show share bar when id is numeric', () => {
        const icon = <span>Icon</span>;

        render(
            <SectionHeader
                icon={icon}
                namespace="finos"
                id="42"
                version="1.0.0"
            />
        );

        expect(screen.queryByTestId('share-bar')).not.toBeInTheDocument();
    });

    it('renders a single breadcrumb as a button before the current trail', () => {
        const crumbs: BreadcrumbItem[] = [
            { namespace: 'finos', type: 'patterns', id: 'api-gateway-pattern', version: '1.0.0' },
        ];

        render(
            <SectionHeader
                icon={<span>Icon</span>}
                namespace="finos"
                id="api-platform"
                version="1.0.0"
                breadcrumbs={crumbs}
            />
        );

        const heading = screen.getByRole('heading');
        expect(heading).toHaveTextContent('api-gateway-pattern');
        expect(heading).toHaveTextContent('api-platform');
        expect(screen.queryByText('…')).not.toBeInTheDocument();
    });

    it('renders two breadcrumbs as two buttons with no ellipsis', () => {
        const crumbs: BreadcrumbItem[] = [
            { namespace: 'finos', type: 'architectures', id: 'microservices-platform', version: '1.0.0' },
            { namespace: 'finos', type: 'architectures', id: 'backend-services', version: '1.0.0' },
        ];

        render(
            <SectionHeader
                icon={<span>Icon</span>}
                namespace="finos"
                id="order-service"
                version="1.0.0"
                breadcrumbs={crumbs}
            />
        );

        const heading = screen.getByRole('heading');
        expect(heading).toHaveTextContent('microservices-platform');
        expect(heading).toHaveTextContent('backend-services');
        expect(screen.queryByText('…')).not.toBeInTheDocument();
    });

    it('collapses middle breadcrumbs into an ellipsis when there are more than two', () => {
        const crumbs: BreadcrumbItem[] = [
            { namespace: 'finos', type: 'architectures', id: 'level-1', version: '1.0.0' },
            { namespace: 'finos', type: 'architectures', id: 'level-2', version: '1.0.0' },
            { namespace: 'finos', type: 'architectures', id: 'level-3', version: '1.0.0' },
        ];

        render(
            <SectionHeader
                icon={<span>Icon</span>}
                namespace="finos"
                id="level-4"
                version="1.0.0"
                breadcrumbs={crumbs}
            />
        );

        expect(screen.getByRole('button', { name: 'level-1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'level-3' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'level-2' })).not.toBeInTheDocument();
        expect(screen.getByText('…')).toBeInTheDocument();
    });

    it('calls onBreadcrumbClick with the correct crumb and index when a breadcrumb is clicked', async () => {
        const user = userEvent.setup();
        const onBreadcrumbClick = vi.fn();
        const crumbs: BreadcrumbItem[] = [
            { namespace: 'finos', type: 'patterns', id: 'api-gateway-pattern', version: '1.0.0' },
        ];

        render(
            <SectionHeader
                icon={<span>Icon</span>}
                namespace="finos"
                id="api-platform"
                version="1.0.0"
                breadcrumbs={crumbs}
                onBreadcrumbClick={onBreadcrumbClick}
            />
        );

        await user.click(screen.getByRole('button', { name: 'api-gateway-pattern' }));
        expect(onBreadcrumbClick).toHaveBeenCalledWith(crumbs[0], 0);
    });

    it('collapses to first and last and navigates to the last crumb when clicked with 3+ breadcrumbs', async () => {
        const user = userEvent.setup();
        const onBreadcrumbClick = vi.fn();
        const crumbs: BreadcrumbItem[] = [
            { namespace: 'finos', type: 'architectures', id: 'root', version: '1.0.0' },
            { namespace: 'finos', type: 'architectures', id: 'middle', version: '1.0.0' },
            { namespace: 'finos', type: 'architectures', id: 'parent', version: '1.0.0' },
        ];

        render(
            <SectionHeader
                icon={<span>Icon</span>}
                namespace="finos"
                id="current"
                version="1.0.0"
                breadcrumbs={crumbs}
                onBreadcrumbClick={onBreadcrumbClick}
            />
        );

        await user.click(screen.getByRole('button', { name: 'parent' }));
        expect(onBreadcrumbClick).toHaveBeenCalledWith(crumbs[2], 2);
    });
});
