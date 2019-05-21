import {
    _SharePointQueryableInstance,
    ISharePointQueryableCollection,
    ISharePointQueryableInstance,
    ISharePointQueryable,
    _SharePointQueryableCollection,
    _SharePointQueryable,
    spInvokableFactory,
} from "../sharepointqueryable";
import { assign, TypedHash } from "@pnp/common";
import { metadata } from "../utils/metadata";
import { IInvokable, body, headers } from "@pnp/odata";
import { defaultPath, deleteable, IDeleteable } from "../decorators";
import { spPost } from "../operations";

/**
 * Result from adding a navigation node
 *
 */
export interface INavigationNodeAddResult {
    data: any;
    node: INavigationNode;
}

/**
 * Represents a collection of navigation nodes
 *
 */
export class _NavigationNodes extends _SharePointQueryableCollection implements _INavigationNodes {

    /**	    
     * Gets a navigation node by id	
     *	
     * @param id The id of the node	
     */
    public getById(id: number): INavigationNode {
        return NavigationNode(this).concat(`(${id})`);
    }

    /**
     * Adds a new node to the collection
     *
     * @param title Display name of the node
     * @param url The url of the node
     * @param visible If true the node is visible, otherwise it is hidden (default: true)
     */
    public async add(title: string, url: string, visible = true): Promise<INavigationNodeAddResult> {

        const postBody = body(assign(metadata("SP.NavigationNode"), {
            IsVisible: visible,
            Title: title,
            Url: url,
        }));

        const data = await spPost(this.clone(NavigationNodes, null), postBody);

        return {
            data,
            node: this.getById(data.Id),
        };
    }

    /**
     * Moves a node to be after another node in the navigation
     *
     * @param nodeId Id of the node to move
     * @param previousNodeId Id of the node after which we move the node specified by nodeId
     */
    public moveAfter(nodeId: number, previousNodeId: number): Promise<void> {

        const postBody = body({
            nodeId: nodeId,
            previousNodeId: previousNodeId,
        });

        return spPost(this.clone(NavigationNodes, "MoveAfter"), postBody);
    }
}

export interface _INavigationNodes {
    getById(id: number): INavigationNode;
    add(title: string, url: string, visible?: boolean): Promise<INavigationNodeAddResult>;
    moveAfter(nodeId: number, previousNodeId: number): Promise<void>;
}

export interface INavigationNodes extends _INavigationNodes, IInvokable, ISharePointQueryableCollection {}

export const NavigationNodes = spInvokableFactory<INavigationNodes>(_NavigationNodes);


/**
 * Represents an instance of a navigation node
 *
 */
@deleteable()
export class _NavigationNode extends _SharePointQueryableInstance implements _INavigationNode {

    /**
     * Represents the child nodes of this node
     */
    public get children(): INavigationNodes {
        return NavigationNodes(this, "children");
    }

    /**
     * Updates this node
     * 
     * @param properties Properties used to update this node
     */
    public async update(properties: TypedHash<string | number | boolean>): Promise<INavNodeUpdateResult> {

        const postBody = body(assign(metadata("SP.NavigationNode"), properties), headers({ "X-HTTP-Method": "MERGE" }));

        const data = await spPost(this, postBody);

        return {
            data,
            node: <any>this,
        };
    }
}

export interface _INavigationNode {
    readonly children: INavigationNodes;
    update(properties: TypedHash<string | number | boolean>): Promise<INavNodeUpdateResult>;
}

export interface INavigationNode extends _INavigationNode, IInvokable, ISharePointQueryableInstance, IDeleteable {}

export const NavigationNode = spInvokableFactory<INavigationNode>(_NavigationNode);

export interface INavNodeUpdateResult {
    data: any;
    node: INavigationNode;
}

/**
 * Exposes the navigation components
 *
 */
@defaultPath("navigation")
export class _Navigation extends _SharePointQueryable implements _INavigation {

    /**
     * Gets the quicklaunch navigation nodes for the current context
     *
     */
    public get quicklaunch(): INavigationNodes {
        return NavigationNodes(this, "quicklaunch");
    }

    /**
     * Gets the top bar navigation nodes for the current context
     *
     */
    public get topNavigationBar(): INavigationNodes {
        return NavigationNodes(this, "topnavigationbar");
    }
}

export interface _INavigation {
    readonly quicklaunch: INavigationNodes;
    readonly topNavigationBar: INavigationNodes;
}

export interface INavigation extends _INavigation, IInvokable, ISharePointQueryable {}

export const Navigation = spInvokableFactory<INavigation>(_Navigation);

/**
 * Represents the top level navigation service
 */
export class _NavigationService extends _SharePointQueryable implements _INavigationService {

    constructor(path: string = null) {
        super("_api/navigation", path);
    }

    /**
     * The MenuState service operation returns a Menu-State (dump) of a SiteMapProvider on a site.
     * 
     * @param menuNodeKey MenuNode.Key of the start node within the SiteMapProvider If no key is provided the SiteMapProvider.RootNode will be the root of the menu state.
     * @param depth Depth of the dump. If no value is provided a dump with the depth of 10 is returned
     * @param mapProviderName The name identifying the SiteMapProvider to be used
     * @param customProperties comma seperated list of custom properties to be returned.
     */
    public getMenuState(menuNodeKey: string = null, depth = 10, mapProviderName: string = null, customProperties: string = null): Promise<IMenuNodeCollection> {

        return spPost(<any>NavigationService("MenuState"), body({
            customProperties,
            depth,
            mapProviderName,
            menuNodeKey,
        }));
    }

    /**
     * Tries to get a SiteMapNode.Key for a given URL within a site collection.
     * 
     * @param currentUrl A url representing the SiteMapNode
     * @param mapProviderName The name identifying the SiteMapProvider to be used
     */
    public getMenuNodeKey(currentUrl: string, mapProviderName: string = null): Promise<string> {

        return spPost(<any>NavigationService("MenuNodeKey"), body({
            currentUrl,
            mapProviderName,
        }));
    }
}

export interface _INavigationService {
    getMenuState(menuNodeKey?: string, depth?: number, mapProviderName?: string, customProperties?: string): Promise<IMenuNodeCollection>;
    getMenuNodeKey(currentUrl: string, mapProviderName?: string): Promise<string>;
}

export interface INavigationService extends _INavigationService {}

export const NavigationService = (path?: string) => <INavigationService>new _NavigationService(path);

export interface IMenuNode {
    CustomProperties: any[];
    FriendlyUrlSegment: string;
    IsDeleted: boolean;
    IsHidden: boolean;
    Key: string;
    Nodes: IMenuNode[];
    NodeType: number;
    SimpleUrl: string;
    Title: string;
}

export interface IMenuNodeCollection {
    FriendlyUrlPrefix: string;
    Nodes: IMenuNode[];
    SimpleUrl: string;
    SPSitePrefix: string;
    SPWebPrefix: string;
    StartingNodeKey: string;
    StartingNodeTitle: string;
    Version: Date;
}
